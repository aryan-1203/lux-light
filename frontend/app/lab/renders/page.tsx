import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RenderStage from "./RenderStage";

// Dev-only: renders one product still per `?shot=<id>` for scripts/render-stills.mjs.
export const metadata: Metadata = { title: "Renders", robots: { index: false, follow: false } };

export default function RendersPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <RenderStage />;
}
