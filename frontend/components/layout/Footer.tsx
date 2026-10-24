import Link from "next/link";
import { legalLinks, siteConfig } from "@/site.config";
import { citedSources } from "@/lib/citations";
import { whatsappHref } from "@/lib/format";
import { Logo } from "./Logo";

async function currentYear() {
  "use cache";
  return new Date().getFullYear();
}

export const DISCLAIMER_TEXT =
  "Wellness product, not a medical device. It is not intended to diagnose, treat, cure or prevent any condition. The research cited studied bright light therapy in general, not this lamp. If you have bipolar disorder, an eye or retinal condition, diabetes, or take medication that makes you sensitive to light, check with your doctor first.";

export async function Footer() {
  const year = await currentYear();
  return (
    <footer id="site-footer" className="border-t border-line bg-bg">
      <div className="container-x grid gap-10 py-14 pb-[max(120px,calc(env(safe-area-inset-bottom)+104px))] lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:pb-14">
        <div>
          <Logo />
          <p className="mt-4 max-w-[40ch] text-small text-fg-muted">{DISCLAIMER_TEXT}</p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-small">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center text-fg-muted hover-fine:text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-fg-muted hover-fine:text-fg">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex min-h-11 items-center text-fg-muted hover-fine:text-fg">
                Email
              </a>
            </li>
          </ul>
          <p className="mt-4 text-[0.8125rem] text-fg-faint">
            © {year} {siteConfig.brandName} · {siteConfig.contact.city}
          </p>
        </div>

        <section id="sources" aria-labelledby="sources-title">
          <h2 id="sources-title" className="text-small font-medium">
            Sources
          </h2>
          <ol className="mt-4 grid gap-3 text-[0.8125rem]">
            {citedSources.map((s, i) => (
              <li key={s.id} id={`src-${s.id}`} className="flex scroll-mt-28 gap-3">
                <span className="w-6 shrink-0 text-fg-faint tabular">[{i + 1}]</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-fg-muted hover-fine:text-fg">
                  <span className="underline decoration-line-strong underline-offset-[3px]">{s.title}</span>
                  <span className="text-fg-faint"> · {[s.authors, s.publisher, s.year].filter(Boolean).join(", ")}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </footer>
  );
}
