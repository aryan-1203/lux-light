import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { footerLinks, siteConfig } from "@/site.config";
import { whatsappHref } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

async function currentYear() {
  "use cache";
  return new Date().getFullYear();
}

export async function Footer() {
  const year = await currentYear();

  return (
    <footer id="site-footer" className="grain border-t border-hairline bg-linen">
      <div className="container-x pt-[clamp(72px,10vw,128px)] pb-[max(32px,env(safe-area-inset-bottom))]">
        {/* Closing line */}
        <div className="flex flex-col gap-8 border-b border-hairline pb-14 md:flex-row md:items-end md:justify-between md:gap-12 md:pb-16">
          <p className="max-w-[16ch] font-display text-display-l text-ink">
            Bring the <em className="italic">morning</em> indoors.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/early-access" size="lg">
              Join early access
            </Button>
            <Button href={whatsappHref()} variant="secondary" size="lg">
              Chat on WhatsApp <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
            </Button>
          </div>
        </div>

        <div className="grid gap-12 py-14 md:grid-cols-12 md:gap-8 md:py-16">
          <div className="md:col-span-5 lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-[36ch] text-small text-ink-muted">{siteConfig.description}</p>
            <div className="mt-8">
              <NewsletterForm />
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7 lg:col-span-6 lg:col-start-7"
          >
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <h2 className="eyebrow !text-ink-muted">{group}</h2>
                <ul className="mt-4 flex flex-col">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="-mx-1 inline-flex min-h-11 items-center px-1 text-small text-ink transition-colors duration-[var(--dur-micro)] ease-[ease] hover-fine:text-sun-800"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Disclaimer />

        <div className="mt-10 flex flex-col-reverse gap-6 text-[0.875rem] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.brandName}. {siteConfig.contact.city}.
          </p>
          <ul className="-mx-2 flex flex-wrap items-center gap-x-1">
            {siteConfig.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center px-2 transition-colors duration-[var(--dur-micro)] ease-[ease] hover-fine:text-ink"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
