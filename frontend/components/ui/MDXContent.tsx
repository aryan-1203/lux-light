import * as runtime from "react/jsx-runtime";
import { createElement, type ComponentType, type ReactNode } from "react";
import { Info } from "lucide-react";

type MDXComponents = Record<string, ComponentType<{ children?: ReactNode }>>;
type MDXModule = ComponentType<{ components?: MDXComponents }>;

const cache = new Map<string, MDXModule>();

/** Velite compiles MDX to a function body; evaluate once per document and cache it. */
function getMDXModule(code: string): MDXModule {
  let mod = cache.get(code);
  if (!mod) {
    const fn = new Function(code);
    mod = fn({ ...runtime }).default as MDXModule;
    cache.set(code, mod);
  }
  return mod;
}

function Note({ children }: { children?: ReactNode }) {
  return (
    <aside className="not-prose my-8 flex gap-3 rounded-md border border-line bg-bg-raise p-5 text-small text-fg">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-fg" strokeWidth={1.75} />
      <div className="[&>p+p]:mt-2">{children}</div>
    </aside>
  );
}

const shared: MDXComponents = {
  Note,
};

export function MDXContent({ code }: { code: string }) {
  // The compiled module is evaluated once per document and cached, not re-created per render.
  return createElement(getMDXModule(code), { components: shared });
}
