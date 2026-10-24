import Script from "next/script";

const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "none";
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
const metaPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Meta Pixel for ad attribution: PageView on load, Lead on a successful form submit (lib/analytics.ts). */
function MetaPixel() {
  if (!metaPixel || !/^\d+$/.test(metaPixel)) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixel}');fbq('track','PageView');`}
    </Script>
  );
}

/** Loads Plausible or GA4 after the page is interactive. Custom events go through lib/analytics.ts. */
export function Analytics() {
  return (
    <>
      <MetaPixel />
      <ProductAnalytics />
    </>
  );
}

function ProductAnalytics() {
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
