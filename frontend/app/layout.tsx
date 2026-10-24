import type { Metadata, Viewport } from "next";
import { Google_Sans, Google_Sans_Code } from "next/font/google";
import { siteConfig } from "@/site.config";
import "./globals.css";

// Google Sans: the typeface of Google's own products, now on Google Fonts. One family for
// headings and text keeps the page calm; weight and size do the hierarchy.
const googleSans = Google_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-google-sans",
});

// Numbers in small readouts (lux values). Not preloaded; it is used sparingly.
const googleSansCode = Google_Sans_Code({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-google-sans-code",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.brandName} · ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.brandName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.brandName,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.brandName,
    title: `${siteConfig.brandName} · ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fffcf7",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${googleSans.variable} ${googleSansCode.variable}`}
    >
      <head>
        {/* Without JS, revealed content must still be visible. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}.bar-x{transform:scaleX(var(--v))!important}.bar-y{transform:scaleY(var(--v))!important}.bar-label{opacity:1!important}.wipe{clip-path:none!important}.scene .k,.scene .s-on,.scene .s-glow,.scene .s-dim,.scene .s-type{animation:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
