import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { SkipLink } from "@/components/layout/SkipLink";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Analytics } from "@/components/layout/Analytics";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { ScrollSpy } from "@/components/layout/ScrollSpy";
import { StickyCta } from "@/components/layout/StickyCta";
import { JsonLd } from "@/components/ui/JsonLd";
import { organizationLd } from "@/lib/jsonld";

// The whole site is prerendered; nothing renders per request.
export const ensureStatic = "navigation";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <MotionProvider>
      <SkipLink />
      <Nav />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <StickyCta />
      <ScrollSpy />
      <SmoothScroll />
      <RevealObserver />
      <Analytics />
      <JsonLd data={organizationLd()} />
    </MotionProvider>
  );
}
