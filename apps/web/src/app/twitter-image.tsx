import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "vibemarketer — Autonomous AI Marketing Fleet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0d10",
          padding: "56px 64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(139,156,179,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139,156,179,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ color: "#d4ff4a", fontSize: 22, letterSpacing: 3 }}>
            MISSION CONTROL FOR GROWTH
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              color: "#e8ecf1",
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 0.95,
            }}
          >
            vibemarketer
          </div>
          <div
            style={{
              color: "#8b9cb3",
              fontSize: 28,
              maxWidth: 820,
              lineHeight: 1.35,
            }}
          >
            Autonomous AI Agent Fleet for your Marketing Department.
          </div>
        </div>
        <div style={{ color: "#d4ff4a", fontSize: 20 }}>
          vibemarketer.fun
        </div>
      </div>
    ),
    { ...size },
  );
}
