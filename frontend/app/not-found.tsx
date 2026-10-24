import Link from "next/link";
import { Logo, LogoGlyph } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="container-x flex h-[var(--nav-h)] items-center">
        <Link href="/" aria-label="Home" className="-m-2 flex items-center rounded-md p-2">
          <Logo />
        </Link>
      </header>
      <main id="main" className="container-x flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <LogoGlyph lit={false} className="h-16 w-auto text-fg-muted" />
        <p className="kicker mt-10">404 · 0 lux</p>
        <h1 className="mt-4 text-display">This page is switched off.</h1>
        <p className="mt-5 max-w-[40ch] text-body-l text-fg-muted">The link may be old, or the page may have moved.</p>
        <Button href="/" size="lg" className="mt-10">
          Back to the light
        </Button>
      </main>
    </div>
  );
}
