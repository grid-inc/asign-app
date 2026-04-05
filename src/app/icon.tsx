import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          borderRadius: "8px",
          color: "white",
          fontSize: "15px",
          fontWeight: 900,
          fontFamily: "sans-serif",
          letterSpacing: "-0.5px",
        }}
      >
        DS2
      </div>
    ),
    { ...size }
  );
}
