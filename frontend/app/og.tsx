import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/site.config";

export const ogSize = { width: 1200, height: 630 };

/** Social card: the lit lamp cut-out on warm white with a sunrise glow, headline on the left. */
export async function ogImage({ eyebrow, title }: { eyebrow: string; title: string }) {
  const lamp = await readFile(join(process.cwd(), "public/renders/lamp-cutout.png"));
  const src = `data:image/png;base64,${lamp.toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#fffcf7" }}>
      <div
        style={{
          position: "absolute",
          right: -160,
          top: -180,
          width: 900,
          height: 900,
          borderRadius: 9999,
          background: "radial-gradient(closest-side, #ffe7b0, rgba(255,214,160,0.55) 45%, rgba(255,214,160,0) 72%)",
          display: "flex",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={src} width={380} height={557} style={{ position: "absolute", right: 110, top: 40 }} />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          width: 720,
          color: "#1f1b16",
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 600 }}>{siteConfig.brandName}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#a35a00" }}>{eyebrow}</div>
          <div style={{ fontSize: 80, lineHeight: 1.02, letterSpacing: -3, marginTop: 18, fontWeight: 600 }}>{title}</div>
        </div>
        <div style={{ fontSize: 24, color: "#635b50" }}>10,000 lux · UV-filtered · Free to join</div>
      </div>
    </div>,
    ogSize,
  );
}
