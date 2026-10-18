import { allPosts, categoryLabels, getPost } from "@/lib/content";
import { ogImage, ogSize } from "../../../og";

export const alt = "Journal post";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return ogImage({
    eyebrow: post ? `Journal · ${categoryLabels[post.category].replace(/s$/, "")}` : "Journal",
    title: post?.title ?? "Notes on light",
  });
}
