import type { AxisScore } from "@vibe/engine";
import { ScoreBar } from "./ScoreBar";

type Props = {
  title: string;
  axis: AxisScore;
  description?: string;
};

function trendTone(trend: AxisScore["trend"]): string {
  if (trend === "improving") return "text-ok";
  if (trend === "declining") return "text-danger";
  return "text-muted";
}

export function AxisPanel({ title, axis, description }: Props) {
  const tone =
    axis.abstain || axis.score < 45
      ? "danger"
      : axis.score >= 70
        ? "accent"
        : "warn";

  return (
    <section className="panel flex flex-col gap-3 p-4" aria-labelledby={`axis-${title}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 id={`axis-${title}`} className="font-display text-base font-semibold">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          ) : null}
        </div>
        <span className="font-mono text-2xl font-bold tabular-nums text-ink">
          {axis.score.toFixed(0)}
        </span>
      </div>
      <ScoreBar value={axis.score} tone={tone} showValue={false} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`border px-2 py-0.5 font-mono ${
            axis.stance === "bullish"
              ? "border-ok/40 text-ok"
              : axis.stance === "bear"
                ? "border-danger/40 text-danger"
                : "border-line text-muted"
          }`}
        >
          {axis.label}
        </span>
        <span className={`font-mono ${trendTone(axis.trend)}`}>{axis.trend}</span>
        <span className="font-mono text-muted">
          conf {(axis.confidence * 100).toFixed(0)}%
        </span>
        {axis.abstain ? (
          <span className="font-mono text-warn">abstain</span>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-muted">{axis.rationale}</p>
    </section>
  );
}
