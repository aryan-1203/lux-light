"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

function FormSkeleton() {
  return (
    <div aria-hidden className="grid animate-pulse gap-5 motion-reduce:animate-none">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="h-[82px] rounded-sm bg-ink/[0.04]" />
        <div className="h-[82px] rounded-sm bg-ink/[0.04]" />
      </div>
      <div className="h-[82px] rounded-sm bg-ink/[0.04]" />
      <div className="h-[120px] rounded-sm bg-ink/[0.04]" />
      <div className="h-[140px] rounded-sm bg-ink/[0.04]" />
      <div className="h-[52px] w-56 rounded-pill bg-ink/[0.06]" />
    </div>
  );
}

const LeadForm = dynamic(() => import("./LeadForm").then((m) => m.LeadForm), { ssr: false, loading: FormSkeleton });

/**
 * The Home page's short form, fetched only when it scrolls within ~1 screen of view, so the
 * form, validation and Turnstile code never weigh on the first paint of the page.
 */
export function LazyLeadForm({ variant }: { variant: "short" | "full" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{near ? <LeadForm variant={variant} /> : <FormSkeleton />}</div>;
}
