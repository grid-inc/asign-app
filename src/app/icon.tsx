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
          background: "#f1f5f9",
          borderRadius: "4px",
          color: "#475569",
          fontSize: "16px",
          fontWeight: 900,
          letterSpacing: "-1.5px",
          textShadow: "0 0 1px #475569, 0 0 1px #475569",
        }}
      >
        DS2
      </div>
    ),
    { ...size }
  );
}
