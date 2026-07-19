const STEPS = [
  { key: "SENSE", desc: "Scan channels & brand signals" },
  { key: "THINK", desc: "Strategy from persistent memory" },
  { key: "CREATE", desc: "Draft posts, threads, assets" },
  { key: "GATE", desc: "HITL quality & brand check" },
  { key: "ACT", desc: "Publish & engage in sandbox" },
  { key: "LEARN", desc: "Feed outcomes back in" },
] as const;

export function LoopDiagram() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {STEPS.map((step, i) => (
        <div
          key={step.key}
          className={`panel pulse-loop flex flex-col gap-2 p-4 ${
            i === 3 ? "[animation-delay:0.4s]" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-lg font-semibold tracking-wide">
              {step.key}
            </span>
          </div>
          <p className="text-sm text-muted">{step.desc}</p>
        </div>
      ))}
    </div>
  );
}
