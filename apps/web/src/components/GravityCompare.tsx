"use client";

import Link from "next/link";
import { ScoreBar } from "@/components/ScoreBar";

export type CompareSide = {
  id: string;
  name: string;
  badge: string;
  product?: string;
  founder_score: number;
  gravity: number;
  audience: number;
  engagement: number;
  velocity: number;
  pull: number;
  followers: number;
  note: string;
};

type Props = {
  left: CompareSide;
  right: CompareSide;
  thesis?: string;
};

function BigNum({ value, label, win }: { value: number; label: string; win?: boolean }) {
  return (
    <div>
      <p
        className={`font-display text-5xl font-bold tracking-tight tabular-nums sm:text-6xl ${
          win ? "text-accent" : "text-ink/80"
        }`}
      >
        {Math.round(value)}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </p>
    </div>
  );
}

function Side({
  side,
  winsGravity,
}: {
  side: CompareSide;
  winsGravity: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col border p-5 sm:p-6 ${
        winsGravity
          ? "border-accent/50 bg-accent/[0.04]"
          : "border-line bg-bg-panel"
      }`}
    >
      {winsGravity ? (
        <span className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-wider text-accent">
          wins gravity
        </span>
      ) : null}
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {side.badge}
      </p>
      <h3 className="mt-2 font-display text-2xl font-bold">{side.name}</h3>
      {side.product ? (
        <p className="mt-1 text-sm text-muted">{side.product}</p>
      ) : null}
      <div className="mt-8">
        <BigNum value={side.gravity} label="Distribution gravity" win={winsGravity} />
      </div>
      <div className="mt-6 space-y-3">
        <ScoreBar value={side.founder_score} label="Founder Score" tone={winsGravity ? "accent" : "cool"} />
        <ScoreBar
          value={Math.min(100, side.velocity * 5)}
          label={`Velocity ${side.velocity.toFixed(1)}`}
          tone="ok"
          showValue={false}
        />
        <ScoreBar
          value={Math.min(100, side.pull)}
          label={`Pull ratio ${side.pull.toFixed(1)}`}
          tone="warn"
          showValue={false}
        />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 font-mono text-xs">
        <div>
          <dt className="text-muted">Audience</dt>
          <dd className="text-lg text-ink">{side.audience.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted">Engagement</dt>
          <dd className="text-lg text-ink">{side.engagement.toLocaleString()}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-muted">{side.note}</p>
      <Link
        href={`/app/founders/${side.id}`}
        className="focus-ring mt-6 inline-block text-sm text-accent hover:underline"
      >
        Open profile →
      </Link>
    </div>
  );
}

export function GravityCompare({ left, right, thesis }: Props) {
  const leftWins = left.gravity >= right.gravity;
  return (
    <div>
      {thesis ? (
        <p className="mb-6 max-w-2xl font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
          {thesis}
        </p>
      ) : null}
      <div className="grid gap-0 md:grid-cols-2 md:gap-px md:bg-line">
        <Side side={left} winsGravity={leftWins} />
        <Side side={right} winsGravity={!leftWins} />
      </div>
      <p className="mt-6 font-mono text-xs text-muted">
        Pedigree ≠ distribution gravity. Cold-start founders with earned attention
        rank fairly — Area of Research #3 in the brief.
      </p>
    </div>
  );
}
