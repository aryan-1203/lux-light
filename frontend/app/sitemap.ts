import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";
import { allPosts } from "@/lib/content";

const ROUTES = [
  "",
  "/how-it-works",
  "/the-lamp",
  "/why-india",
  "/journal",
  "/stories",
  "/faq",
  "/early-access",
  "/about",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  return [
    ...ROUTES.map((r) => ({
      url: `${base}${r}`,
      changeFrequency: (r === "" || r === "/journal" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: r === "" ? 1 : r === "/early-access" ? 0.9 : 0.7,
    })),
    ...allPosts().map((p) => ({
      url: `${base}${p.url}`,
      lastModified: p.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
