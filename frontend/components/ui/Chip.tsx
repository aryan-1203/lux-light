import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = ComponentProps<"span"> & { tone?: "default" | "sun" | "glass" };

const tones = {
  default: "border-hairline bg-paper text-ink",
  sun: "border-sun-200 bg-sun-50 text-ink",
  glass: "border-white/60 bg-white/55 text-ink backdrop-blur-sm",
};

/** Static label chip. Toggle chips for forms live in ChipGroup. */
export function Chip({ tone = "default", className, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-pill border px-4 text-small font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
