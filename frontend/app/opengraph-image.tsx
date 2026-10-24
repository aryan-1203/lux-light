import { siteConfig } from "@/site.config";
import { ogImage, ogSize } from "./og";

export const alt = `${siteConfig.brandName}: a 10,000-lux light lamp, switched on.`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({ eyebrow: "Waitlist open · Founding batch", title: "Sunrise, on your desk." });
}
