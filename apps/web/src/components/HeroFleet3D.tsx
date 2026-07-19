"use client";

import { useEffect, useRef, useState } from "react";

const LAYERS = [
  { label: "SENSE", detail: "scan channels", accent: false },
  { label: "THINK", detail: "brand memory", accent: false },
  { label: "CREATE", detail: "on-voice drafts", accent: true },
  { label: "GATE", detail: "HITL dial", accent: false },
  { label: "ACT", detail: "publish · engage", accent: false },
  { label: "LEARN", detail: "never reset", accent: true },
] as const;

/**
 * Lightweight CSS 3D isometric fleet stack with pointer tilt.
 * Inspired by isometric floating-layer patterns (no WebGL / Spline).
 */
export function HeroFleet3D() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: -12, y: 18 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: -12 - py * 14,
      y: 18 + px * 16,
    });
  }

  function onLeave() {
    if (reduceMotion) return;
    setTilt({ x: -12, y: 18 });
  }

  return (
    <div
      ref={stageRef}
      className="hero-3d-stage relative mx-auto aspect-square w-full max-w-[520px] select-none"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(212,255,74,0.16),transparent_65%)]" />

      <div
        className="hero-3d-scene absolute inset-0 flex items-center justify-center"
        style={{
          perspective: "1100px",
          perspectiveOrigin: "50% 45%",
        }}
      >
        <div
          className="hero-3d-rig relative h-[72%] w-[78%]"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: reduceMotion
              ? "none"
              : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform",
          }}
        >
          {LAYERS.map((layer, i) => {
            const depth = (i - 2.5) * 36;
            const floatDelay = `${i * 0.35}s`;
            return (
              <div
                key={layer.label}
                className={`hero-3d-layer absolute left-1/2 top-1/2 w-[88%] ${
                  layer.accent ? "hero-3d-layer--accent" : ""
                } ${reduceMotion ? "" : "hero-3d-float"}`}
                style={{
                  transform: `translate(-50%, -50%) translateZ(${depth}px) translateY(${i * 10 - 24}px)`,
                  zIndex: LAYERS.length - i,
                  animationDelay: floatDelay,
                }}
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:text-[11px]">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p className="font-display text-lg font-bold tracking-tight text-ink sm:text-xl">
                      {layer.label}
                    </p>
                  </div>
                  <p className="max-w-[9rem] text-right text-sm text-muted sm:text-base">
                    {layer.detail}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Floating gravity chip */}
          <div
            className={`absolute -right-2 top-[8%] rounded-md border border-accent/40 bg-bg/90 px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:-right-4 ${
              reduceMotion ? "" : "hero-3d-chip"
            }`}
            style={{ transform: "translateZ(120px)" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Gravity
            </p>
            <p className="font-display text-3xl font-bold tabular-nums text-ink">
              89
            </p>
            <p className="text-xs text-muted">Cold-start founder</p>
          </div>

          <div
            className={`absolute -left-1 bottom-[10%] rounded-md border border-line bg-bg/90 px-3 py-2 backdrop-blur-sm sm:-left-3 ${
              reduceMotion ? "" : "hero-3d-chip"
            }`}
            style={{
              transform: "translateZ(90px)",
              animationDelay: "0.8s",
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Autonomy
            </p>
            <p className="font-display text-xl font-semibold text-accent">L1 → L3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
