import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "group/btn relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill font-sans font-semibold " +
  "transition-[transform,translate,scale,rotate,background-color,border-color,color] duration-[var(--dur-press)] ease-out " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover-fine:bg-[#33312d]",
  accent: "bg-sun-400 text-ink hover-fine:bg-[#ffd27a]",
  secondary: "border border-line-strong/60 bg-transparent text-ink hover-fine:border-ink hover-fine:bg-ink/[0.03]",
  ghost: "bg-transparent text-ink hover-fine:bg-ink/[0.05]",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-[52px] px-7 text-base",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

type AsLink = Common & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button(props: AsLink | AsButton) {
  if (props.href !== undefined) {
    const { variant = "primary", size = "md", className, children, href, ...rest } = props;
    const classes = buttonClasses(variant, size, className);
    const external = /^https?:\/\//.test(href);
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...(rest as ComponentProps<"a">)}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant = "primary", size = "md", className, children, type = "button", ...rest } = props;
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
