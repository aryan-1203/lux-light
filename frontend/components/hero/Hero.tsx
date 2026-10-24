import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowDown, Check } from "lucide-react";
import { joinHref, siteConfig } from "@/site.config";
import { lux } from "@/data/specs";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/Button";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

/** Full-screen hero. The lamp is the light source of the page: a warm glow spreads from its panel. */
export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-bg lg:min-h-[max(680px,100svh)]"
    >
      {/* Light from the lamp, spreading over the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[44%] left-1/2 -z-10 size-[150vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#fff3d6,rgb(255_222_170/0.65)_35%,rgb(255_200_150/0.25)_60%,transparent_75%)] lg:top-1/2 lg:left-[72%] lg:size-[110vw]"
      />

      <div className="container-x grid items-center gap-x-10 gap-y-4 pt-[calc(var(--nav-h)+env(safe-area-inset-top)+8px)] pb-12 lg:min-h-[max(680px,100svh)] lg:grid-cols-[1.05fr_1fr] lg:pt-[var(--nav-h)] lg:pb-0">
        <div className="relative z-10 max-w-[600px]">
          <p data-hero-in="" style={i(0)} className="kicker inline-flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-sun shadow-[0_0_0_4px_rgb(255_185_56/0.25)]" />
            Waitlist open · Founding batch
          </p>
          <h1 id="hero-title" data-hero-in="" style={i(1)} className="mt-5 text-hero">
            <span className="text-sunrise">Sunrise,</span>
            <br />
            on your desk.
          </h1>
          <p data-hero-in="" style={i(2)} className="mt-6 max-w-[48ch] text-body-l text-fg-muted">
            Indoor light is a fraction of a morning outside. {siteConfig.brandName} is a {formatNumber(lux.peak.value)}
            -lux, UV-filtered light panel for foggy winters, monsoon skies and long days indoors. Thirty minutes with
            your chai.
          </p>
          <div data-hero-in="" style={i(3)} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href={joinHref} size="lg">
              Join the waitlist
            </Button>
            <Button href="#why" variant="ghost" size="lg">
              Why 10,000 lux? <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
            </Button>
          </div>
          <ul
            data-hero-in=""
            style={i(4)}
            className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-small text-fg-muted"
            aria-label="About the waitlist"
          >
            {["Free to join", "No payment now", `First ${formatNumber(siteConfig.launchBatchSize)} lamps`].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check aria-hidden className="size-4 text-accent-fg" strokeWidth={2} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* The lamp. Phones: above the headline and small enough that the whole pitch fits one screen. */}
        <div className="relative order-first mx-auto w-[min(58vw,calc(33svh*0.68),300px)] lg:order-none lg:w-full lg:max-w-[520px]">
          <div className="relative aspect-[600/880]">
            {/* Halo around the lit panel */}
            <div
              aria-hidden
              className="absolute top-[10%] right-[4%] left-[6%] h-[50%] rotate-[-4deg] rounded-[18%] bg-[#ffd98a] opacity-80 blur-[40px]"
            />
            <Image
              src="/renders/lamp-cutout.png"
              alt={`The ${siteConfig.brandName} lamp: a large glowing panel on a curved arm and a white base.`}
              fill
              priority
              sizes="(min-width: 1024px) 520px, 300px"
              className="object-contain"
            />
          </div>
          {/* Meter */}
          <div className="absolute right-[76%] bottom-[26%] flex items-center gap-2 rounded-pill bg-bg-raise/90 py-1.5 pr-3 pl-1.5 whitespace-nowrap shadow-soft backdrop-blur lg:right-[-4%] lg:bottom-[4%] lg:gap-3 lg:py-2 lg:pr-4 lg:pl-2">
            <span aria-hidden className="grid size-7 place-items-center rounded-full bg-glow text-accent-fg lg:size-8">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="flex items-baseline gap-1.5 text-[1.0625rem] font-medium tabular lg:text-title">
                {formatNumber(lux.peak.value)}
                <span className="text-small font-normal text-fg-muted">lux</span>
              </span>
              <span className="hidden text-[0.75rem] text-fg-muted lg:block">at {lux.measuredAtCm.value} cm from the panel</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
