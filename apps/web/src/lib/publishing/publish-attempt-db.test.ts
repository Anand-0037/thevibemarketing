import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type QueryResult<T> = {
  rows: T[];
};

async function runSupabaseQuery(args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("supabase", args, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 8,
    });
    return stdout;
  } catch (error) {
    const output = error as { stdout?: string; stderr?: string };
    const stdout = output.stdout ?? "";
    const stderr = output.stderr ?? "";
    if (
      stderr.includes("Timeout while shutting down PostHog") &&
      !stderr.includes("failed to execute query")
    ) {
      return stdout;
    }
    throw error;
  }
}

async function query<T = Record<string, unknown>>(sql: string): Promise<QueryResult<T>> {
  const stdout = await runSupabaseQuery(["db", "query", "--local", "--output", "json", sql]);
  const jsonStart = stdout.indexOf("{");
  assert.notEqual(jsonStart, -1, `supabase db query did not return JSON: ${stdout}`);
  return JSON.parse(stdout.slice(jsonStart)) as QueryResult<T>;
}

async function execSql(sql: string): Promise<void> {
  await runSupabaseQuery(["db", "query", "--local", sql]);
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function createUser(id: string, email: string): Promise<void> {
  await execSql(`
    insert into auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) values (
      ${sqlString(id)},
      'authenticated',
      'authenticated',
      ${sqlString(email)},
      'local-test-password',
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb
    )
    on conflict (id) do nothing;
  `);
}

async function cleanup(ownerIds: string[]): Promise<void> {
  if (!ownerIds.length) return;
  const ids = ownerIds.map(sqlString).join(", ");
  await execSql(`delete from auth.users where id in (${ids});`);
}

async function createAttempt(input: {
  ownerId: string;
  postId: string;
  revision: string;
  provider: string;
  account: string;
  idempotencyKey: string;
  requestHash: string;
}): Promise<{ attempt_id: string; job_id: string; job_status: string }> {
  const result = await query<{ attempt_id: string; job_id: string; job_status: string }>(`
    select
      attempt ->> 'id' as attempt_id,
      outbox_job ->> 'id' as job_id,
      outbox_job ->> 'status' as job_status
    from public.create_or_reuse_marketing_publish_attempt(
      ${sqlString(input.ownerId)}::uuid,
      ${sqlString(input.postId)},
      ${sqlString(input.revision)},
      ${sqlString(input.provider)},
      ${sqlString(input.account)},
      ${sqlString(input.idempotencyKey)},
      ${sqlString(input.requestHash)}
    );
  `);
  assert.equal(result.rows.length, 1);
  return result.rows[0];
}

async function main(): Promise<void> {
  const ownerA = randomUUID();
  const ownerB = randomUUID();
  const run = randomUUID().slice(0, 8);
  const postId = `post-${run}`;
  const revision = `rev-${run}`;
  const idempotencyKey = `idem-${run}`;
  const requestHash = `hash-${run}`;

  await createUser(ownerA, `${run}-a@example.test`);
  await createUser(ownerB, `${run}-b@example.test`);

  try {
    const created = await Promise.all(
      Array.from({ length: 20 }, () =>
        createAttempt({
          ownerId: ownerA,
          postId,
          revision,
          provider: "x",
          account: "acct-1",
          idempotencyKey,
          requestHash,
        }),
      ),
    );

    assert.equal(new Set(created.map((entry) => entry.attempt_id)).size, 1);
    assert.equal(new Set(created.map((entry) => entry.job_id)).size, 1);

    const counts = await query<{ attempts: number; jobs: number }>(`
      select
        (select count(*)::int from public.marketing_publish_attempts where owner_id = ${sqlString(ownerA)}::uuid) as attempts,
        (select count(*)::int from public.marketing_outbox_jobs where owner_id = ${sqlString(ownerA)}::uuid) as jobs;
    `);
    assert.deepEqual(counts.rows[0], { attempts: 1, jobs: 1 });

    const claimResults = await Promise.all(
      Array.from({ length: 2 }, (_, index) =>
        query<{ id: string; lease_owner: string; status: string }>(`
          select id, lease_owner, status
          from public.claim_marketing_outbox_job('worker-${index + 1}', 30000);
        `),
      ),
    );
    const claimed = claimResults.flatMap((result) => result.rows);
    assert.equal(claimed.length, 1, "only one worker can claim the available job");
    assert.equal(claimed[0].status, "leased");

    const retryWhileLeased = await createAttempt({
      ownerId: ownerA,
      postId,
      revision,
      provider: "x",
      account: "acct-1",
      idempotencyKey,
      requestHash,
    });
    assert.equal(retryWhileLeased.job_status, "leased", "approval retry preserves active lease");

    const releasedBeforeExpiry = await query<{ released: number }>(
      "select public.release_expired_marketing_outbox_leases()::int as released;",
    );
    assert.equal(releasedBeforeExpiry.rows[0].released, 0);

    await execSql(`
      update public.marketing_outbox_jobs
      set lease_expires_at = now() - interval '1 second'
      where id = ${sqlString(created[0].job_id)}::uuid;
    `);
    const releasedAfterExpiry = await query<{ released: number }>(
      "select public.release_expired_marketing_outbox_leases()::int as released;",
    );
    assert.equal(releasedAfterExpiry.rows[0].released, 1);

    const reclaimed = await query<{ id: string; lease_owner: string; status: string }>(`
      select id, lease_owner, status
      from public.claim_marketing_outbox_job('worker-reclaim', 30000);
    `);
    assert.equal(reclaimed.rows.length, 1);
    assert.equal(reclaimed.rows[0].id, created[0].job_id);
    assert.equal(reclaimed.rows[0].lease_owner, "worker-reclaim");

    await assert.rejects(
      () =>
        createAttempt({
          ownerId: ownerA,
          postId,
          revision: `${revision}-conflict`,
          provider: "x",
          account: "acct-1",
          idempotencyKey,
          requestHash: `${requestHash}-conflict`,
        }),
      /publish attempt idempotency conflict/,
    );

    const ownerBVisible = await query<{ attempts: number; jobs: number }>(`
      select
        (select count(*)::int from public.marketing_publish_attempts where owner_id = ${sqlString(ownerB)}::uuid) as attempts,
        (select count(*)::int from public.marketing_outbox_jobs where owner_id = ${sqlString(ownerB)}::uuid) as jobs;
    `);
    assert.deepEqual(ownerBVisible.rows[0], { attempts: 0, jobs: 0 });

    console.log("publish-attempt-db.test: ok");
  } finally {
    await cleanup([ownerA, ownerB]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
