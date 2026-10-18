import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = ComponentProps<"div"> & { tone?: "linen" | "paper" | "sun"; interactive?: boolean };

const tones = {
  linen: "bg-linen",
  paper: "bg-paper",
  sun: "bg-sun-50",
};

export function Card({ tone = "linen", interactive = false, className, ...rest }: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-hairline",
        tones[tone],
        interactive &&
          "transition-[border-color,transform,translate] duration-[var(--dur-ui)] ease-out hover-fine:-translate-y-0.5 hover-fine:border-line-strong/50",
        className,
      )}
      {...rest}
    />
  );
}
