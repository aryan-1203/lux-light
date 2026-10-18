import { ImageResponse } from "next/og";
import { siteConfig } from "@/site.config";

export const ogSize = { width: 1200, height: 630 };

/** Shared OG card: warm sunrise field, lit lamp, title. Uses the default font (no network at build). */
export function ogImage({ eyebrow, title }: { eyebrow: string; title: string }) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(180deg, #fbeee6 0%, #fde6c9 45%, #fff4d6 100%)",
        padding: "72px 80px",
        position: "relative",
        fontFamily: "serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -120,
          top: -60,
          width: 760,
          height: 760,
          borderRadius: 9999,
          background: "radial-gradient(closest-side, #ffffff, #fff4d6 45%, rgba(255,231,168,0))",
          display: "flex",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 760 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#1c1b19" }}>
          <div
            style={{
              width: 26,
              height: 34,
              border: "3px solid #1c1b19",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 9999, background: "#ffc857" }} />
          </div>
          {siteConfig.brandName}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#9a5f12",
              fontFamily: "monospace",
            }}
          >
            {eyebrow}
          </div>
          <div style={{ fontSize: 72, lineHeight: 1.04, letterSpacing: -2, color: "#1c1b19", marginTop: 18 }}>
            {title}
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#6b665e", fontFamily: "monospace" }}>
          10,000 lux · UV-free · Made for Indian mornings
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 150,
          top: 135,
          width: 270,
          height: 360,
          borderRadius: 30,
          background: "linear-gradient(160deg,#f7f2ea,#e6ddce)",
          border: "1px solid rgba(28,27,25,0.1)",
          display: "flex",
          padding: 16,
          boxShadow: "0 40px 80px -40px rgba(80,60,30,0.5)",
        }}
      >
        <div
          style={{
            flex: 1,
            borderRadius: 18,
            background: "radial-gradient(120% 90% at 50% 45%, #ffffff, #fffaf0 40%, #fff1cf 75%, #ffe2a0)",
            display: "flex",
          }}
        />
      </div>
    </div>,
    ogSize,
  );
}
