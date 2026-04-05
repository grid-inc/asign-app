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
          background: "white",
          borderRadius: "4px",
          color: "#3b82f6",
          fontSize: "12px",
          fontWeight: 900,
          letterSpacing: "-1px",
          border: "2px solid #3b82f6",
        }}
      >
        DS2
      </div>
    ),
    { ...size }
  );
}
