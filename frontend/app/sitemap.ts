import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

const ROUTES = ["", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  return ROUTES.map((r) => ({
    url: `${base}${r}`,
    changeFrequency: r === "" ? "weekly" : "yearly",
    priority: r === "" ? 1 : 0.3,
  }));
}
