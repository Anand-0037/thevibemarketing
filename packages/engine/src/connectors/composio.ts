/**
 * Composio connector — live REST when COMPOSIO_API_KEY is set.
 * OAuth: ensure auth_config → POST /v3/connected_accounts/link → redirect_url.
 * Offline: returns { status: "stub" } without throwing.
 */

const COMPOSIO_BASE = "https://backend.composio.dev/api/v3";

export type ComposioConnectResult =
  | { status: "stub"; userId: string; toolkit: string; message: string }
  | {
      status: "ok";
      url: string;
      linkToken?: string;
      connectedAccountId?: string;
      expiresAt?: string;
      toolkit: string;
      authConfigId: string;
    }
  | { status: "error"; message: string; toolkit: string };

export type ComposioExecuteResult =
  | { status: "stub"; userId: string; tool: string; message: string }
  | { status: "ok"; data: unknown }
  | { status: "error"; message: string };

export type ComposioHealth = {
  configured: boolean;
  ok: boolean;
  toolkitCount?: number;
  sample?: string[];
  error?: string;
};

function apiKey(): string | null {
  return process.env.COMPOSIO_API_KEY?.trim() || null;
}

function headers(key: string): Record<string, string> {
  return {
    "x-api-key": key,
    "Content-Type": "application/json",
  };
}

/** Map UI toolkit ids → Composio toolkit slugs. */
export function normalizeToolkitSlug(toolkit: string): string {
  const t = toolkit.trim().toLowerCase();
  const map: Record<string, string> = {
    twitter: "twitter",
    x: "twitter",
    linkedin: "linkedin",
    reddit: "reddit",
    github: "github",
    gmail: "gmail",
    notion: "notion",
    instagram: "instagram",
  };
  return map[t] || t;
}

export async function composioHealth(): Promise<ComposioHealth> {
  const key = apiKey();
  if (!key) {
    return { configured: false, ok: false, error: "COMPOSIO_API_KEY unset" };
  }
  try {
    const res = await fetch(`${COMPOSIO_BASE}/toolkits?limit=5`, {
      headers: headers(key),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return {
        configured: true,
        ok: false,
        error: `Composio toolkits HTTP ${res.status}`,
      };
    }
    const body = (await res.json()) as {
      items?: Array<{ slug?: string; name?: string }>;
      total_items?: number;
    };
    return {
      configured: true,
      ok: true,
      toolkitCount: body.total_items,
      sample: (body.items ?? []).map((i) => i.slug || i.name || "?").slice(0, 5),
    };
  } catch (e) {
    return {
      configured: true,
      ok: false,
      error: e instanceof Error ? e.message : "Composio health failed",
    };
  }
}

async function listAuthConfigs(
  key: string,
  toolkitSlug: string,
): Promise<Array<{ id: string; toolkit?: { slug?: string } }>> {
  const res = await fetch(`${COMPOSIO_BASE}/auth_configs?limit=50`, {
    headers: headers(key),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    items?: Array<{ id: string; toolkit?: { slug?: string } }>;
  };
  return (body.items ?? []).filter(
    (i) => (i.toolkit?.slug || "").toLowerCase() === toolkitSlug.toLowerCase(),
  );
}

async function ensureAuthConfig(
  key: string,
  toolkitSlug: string,
): Promise<string | null> {
  const existing = await listAuthConfigs(key, toolkitSlug);
  if (existing[0]?.id) return existing[0].id;

  const res = await fetch(`${COMPOSIO_BASE}/auth_configs`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      toolkit: { slug: toolkitSlug },
      auth_scheme: "OAUTH2",
      use_composio_auth: true,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    // alternate payload shape
    const res2 = await fetch(`${COMPOSIO_BASE}/auth_configs`, {
      method: "POST",
      headers: headers(key),
      body: JSON.stringify({
        toolkit: { slug: toolkitSlug },
        type: "use_composio_managed_auth",
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res2.ok) return null;
    const b2 = (await res2.json()) as { auth_config?: { id?: string } };
    return b2.auth_config?.id ?? null;
  }
  const body = (await res.json()) as { auth_config?: { id?: string } };
  return body.auth_config?.id ?? null;
}

/**
 * Return a hosted OAuth connect link for `toolkit`.
 * Live when COMPOSIO_API_KEY set; otherwise stub.
 */
export async function getConnectLink(
  userId: string,
  toolkit: string,
  options?: { throwIfMissingKey?: boolean },
): Promise<ComposioConnectResult> {
  const uid = userId?.trim() || "anonymous";
  const tk = normalizeToolkitSlug(toolkit || "unknown");
  const key = apiKey();

  if (!key) {
    if (options?.throwIfMissingKey) {
      throw new Error("COMPOSIO_API_KEY not configured");
    }
    return {
      status: "stub",
      userId: uid,
      toolkit: tk,
      message:
        "COMPOSIO_API_KEY unset — offline stub (no OAuth window opened)",
    };
  }

  try {
    const authConfigId = await ensureAuthConfig(key, tk);
    if (!authConfigId) {
      return {
        status: "error",
        toolkit: tk,
        message: `Could not create/find auth_config for toolkit "${tk}"`,
      };
    }

    const res = await fetch(`${COMPOSIO_BASE}/connected_accounts/link`, {
      method: "POST",
      headers: headers(key),
      body: JSON.stringify({
        user_id: uid,
        auth_config_id: authConfigId,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        status: "error",
        toolkit: tk,
        message: `Composio link HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    const body = JSON.parse(text) as {
      redirect_url?: string;
      link_token?: string;
      connected_account_id?: string;
      expires_at?: string;
    };
    if (!body.redirect_url) {
      return {
        status: "error",
        toolkit: tk,
        message: "Composio link OK but no redirect_url in response",
      };
    }
    return {
      status: "ok",
      url: body.redirect_url,
      linkToken: body.link_token,
      connectedAccountId: body.connected_account_id,
      expiresAt: body.expires_at,
      toolkit: tk,
      authConfigId,
    };
  } catch (e) {
    return {
      status: "error",
      toolkit: tk,
      message: e instanceof Error ? e.message : "Composio connect failed",
    };
  }
}

/**
 * Execute a Composio tool — still stub for publish until accounts are connected.
 * Live path reserved for when connected_account exists.
 */
export async function executeTool(
  userId: string,
  tool: string,
  args: Record<string, unknown>,
  options?: { throwIfMissingKey?: boolean },
): Promise<ComposioExecuteResult> {
  void args;
  const uid = userId?.trim() || "anonymous";
  const toolName = tool?.trim() || "unknown";
  const key = apiKey();

  if (!key) {
    if (options?.throwIfMissingKey) {
      throw new Error("COMPOSIO_API_KEY not configured");
    }
    return {
      status: "stub",
      userId: uid,
      tool: toolName,
      message: "COMPOSIO_API_KEY unset — execute stub",
    };
  }

  return {
    status: "stub",
    userId: uid,
    tool: toolName,
    message:
      "Key live — OAuth connect works; tool execute needs a connected account + tool slug. Publish still HITL stub ACT until you complete connect.",
  };
}
