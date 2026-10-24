import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * sun:    the sunrise gradient with ink text; the one primary action on any screen.
 * ghost:  hairline outline; secondary actions.
 */
type Variant = "sun" | "ghost";
type Size = "md" | "lg";

const base =
  "group/btn relative inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-pill font-sans font-medium " +
  "transition-[scale,background-color,border-color,color,box-shadow] duration-[var(--dur-press)] ease-out " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

const variants: Record<Variant, string> = {
  sun: "bg-[linear-gradient(135deg,#ffc24d,#ff9a5a)] text-fg shadow-[0_1px_0_rgb(255_255_255/0.5)_inset,0_10px_30px_-10px_rgb(255_140_60/0.6)] hover-fine:shadow-[0_1px_0_rgb(255_255_255/0.5)_inset,0_14px_36px_-10px_rgb(255_140_60/0.75)]",
  ghost: "border border-line-strong bg-bg-raise/60 text-fg hover-fine:border-fg/50 hover-fine:bg-bg-raise",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-14 px-7 text-base",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };
type AsLink = Common & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

export function buttonClasses(variant: Variant = "sun", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button(props: AsLink | AsButton) {
  if (props.href !== undefined) {
    const { variant = "sun", size = "md", className, children, href, ...rest } = props;
    const classes = buttonClasses(variant, size, className);
    if (/^https?:\/\//.test(href)) {
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
  const { variant = "sun", size = "md", className, children, type = "button", ...rest } = props;
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
