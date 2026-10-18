import { siteConfig } from "@/site.config";
import { ogImage, ogSize } from "./og";

export const alt = `${siteConfig.brandName}: ${siteConfig.tagline}`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({ eyebrow: "Early access open", title: "Bring the morning indoors." });
}
