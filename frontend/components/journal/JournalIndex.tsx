"use client";

import { LayoutGroup, m } from "motion/react";
import { useEffect, useState } from "react";
import type { Category, Post } from "@/lib/content";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { PostCard } from "./PostCard";

const TABS: { id: "all" | Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "guide", label: "Guides" },
  { id: "article", label: "Articles" },
  { id: "news", label: "News" },
];

type TabId = (typeof TABS)[number]["id"];

/**
 * Filter tabs (All · Guides · Articles · News) over statically rendered posts.
 * The choice is mirrored in ?category= so links are shareable, without making the page dynamic.
 */
export function JournalIndex({ posts }: { posts: Post[] }) {
  const [tab, setTab] = useState<TabId>("all");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("category");
    const match = TABS.find((t) => t.id === fromUrl || t.label.toLowerCase() === fromUrl);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after hydration
    if (match) setTab(match.id);
  }, []);

  const select = (id: TabId) => {
    setTab(id);
    const url = new URL(window.location.href);
    if (id === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", id);
    window.history.replaceState(null, "", url);
  };

  const visible = tab === "all" ? posts : posts.filter((p) => p.category === tab);

  return (
    <div>
      <LayoutGroup>
        <div
          role="tablist"
          aria-label="Filter posts"
          className="inline-flex flex-wrap gap-1 rounded-pill bg-ink/[0.05] p-1"
        >
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={active}
                aria-controls="journal-panel"
                onClick={() => select(t.id)}
                className={cn(
                  "relative h-10 cursor-pointer rounded-pill px-5 text-small font-medium transition-colors duration-[var(--dur-micro)] ease-[ease]",
                  active ? "text-paper" : "text-ink-muted hover-fine:text-ink",
                )}
              >
                {active && (
                  <m.span
                    layoutId="journal-tab"
                    transition={spring.ui}
                    className="absolute inset-0 rounded-pill bg-ink"
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <ul id="journal-panel" role="tabpanel" className="mt-10 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((post, i) => (
          <m.li
            key={post.slug}
            initial={{ opacity: 0, transform: "translateY(8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1], delay: Math.min(i, 6) * 0.04 }}
          >
            <PostCard post={post} priority={i < 3} />
          </m.li>
        ))}
      </ul>
      {visible.length === 0 && <p className="mt-10 text-body text-ink-muted">Nothing here yet.</p>}
    </div>
  );
}
