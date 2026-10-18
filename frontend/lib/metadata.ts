import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: `/${string}`;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · ${siteConfig.brandName}`, description, url: path },
  };
}
