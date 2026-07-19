import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0d10",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 120,
            height: 80,
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingBottom: 8,
          }}
        >
          {[28, 48, 36, 64, 44].map((h, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: h,
                background: "#d4ff4a",
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
