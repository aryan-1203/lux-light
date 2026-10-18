import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2";
  size?: "l" | "m";
  className?: string;
  id?: string;
};

/** Eyebrow (mono label) → display heading → lede. Hierarchy by size and weight first. */
export function SectionHeading({ eyebrow, title, lede, align = "start", as = "h2", size = "m", className, id }: Props) {
  const Heading = as;
  return (
    <div className={cn("flex flex-col", align === "center" && "items-center text-center", className)}>
      {eyebrow && <p className="eyebrow mb-4 md:mb-5">{eyebrow}</p>}
      <Heading id={id} className={cn("max-w-[22ch] text-ink", size === "l" ? "text-display-l" : "text-display-m")}>
        {title}
      </Heading>
      {lede && (
        <p className={cn("mt-5 max-w-[56ch] text-body-l text-ink-muted md:mt-6", align === "center" && "mx-auto")}>
          {lede}
        </p>
      )}
    </div>
  );
}
