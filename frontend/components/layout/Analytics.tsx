import Script from "next/script";

const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "none";
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const ga4 = process.env.NEXT_PUBLIC_GA4_ID;

/** Loads Plausible or GA4 after the page is interactive. Custom events go through lib/analytics.ts. */
export function Analytics() {
  if (provider === "plausible" && plausibleDomain) {
    return (
      <>
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.tagged-events.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-queue" strategy="afterInteractive">
          {
            "window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }"
          }
        </Script>
      </>
    );
  }
  if (provider === "ga4" && ga4) {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga4}',{anonymize_ip:true});`}
        </Script>
      </>
    );
  }
  return null;
}
