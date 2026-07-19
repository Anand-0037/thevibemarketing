"use client";

import { useEffect, useState } from "react";
import { PIPELINE_STEPS } from "@/content/pipeline-steps";

type Props = {
  active: boolean;
  /** When true, snap all steps to done */
  complete?: boolean;
  onDoneVisual?: () => void;
};

/**
 * Live pipeline steps while screen/memo runs.
 */
export function ScreeningTheater({ active, complete, onDoneVisual }: Props) {
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    if (!active && !complete) {
      setIndex(-1);
      return;
    }
    if (complete) {
      setIndex(PIPELINE_STEPS.length);
      onDoneVisual?.();
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIndex(PIPELINE_STEPS.length);
      onDoneVisual?.();
      return;
    }
    setIndex(0);
    const id = window.setInterval(() => {
      setIndex((i) => {
        if (i >= PIPELINE_STEPS.length - 1) return i;
        return i + 1;
      });
    }, 420);
    return () => window.clearInterval(id);
  }, [active, complete, onDoneVisual]);

  if (!active && !complete) return null;

  return (
    <div
      className="panel screening-theater mt-6 overflow-hidden border-accent/30 p-4"
      role="status"
      aria-live="polite"
      aria-label="Screening pipeline"
    >
      <p className="section-label mb-3">Agent pipeline</p>
      <ol className="space-y-2">
        {PIPELINE_STEPS.map((step, i) => {
          const done = complete || i < index;
          const current = !complete && i === index;
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 font-mono text-xs transition-opacity ${
                done || current ? "opacity-100" : "opacity-35"
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center border text-[10px] ${
                  done
                    ? "border-ok/50 bg-ok/15 text-ok"
                    : current
                      ? "border-accent/60 bg-accent/15 text-accent pulse-step"
                      : "border-line text-muted"
                }`}
              >
                {done ? "✓" : current ? "▸" : String(i + 1)}
              </span>
              <span className={current ? "text-accent" : done ? "text-ink" : "text-muted"}>
                {step.label}
              </span>
              <span className="ml-auto text-[10px] text-muted">{step.id}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
