import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { SwitchedOffLamp } from "@/components/layout/SwitchedOffLamp";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="container-x flex h-[var(--nav-h)] items-center">
        <Link href="/" aria-label="Home" className="-m-2 flex items-center rounded-md p-2">
          <Logo />
        </Link>
      </header>
      <main id="main" className="container-x flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <SwitchedOffLamp />
        <p className="eyebrow mt-12">404</p>
        <h1 className="mt-4 text-display-m text-ink">This page is switched off.</h1>
        <p className="mt-4 max-w-[40ch] text-body-l text-ink-muted">
          The link may be old, or the page may have moved. Switch the lamp on to head back.
        </p>
        <Button href="/" className="mt-8" size="lg">
          Back to the light
        </Button>
      </main>
    </div>
  );
}
