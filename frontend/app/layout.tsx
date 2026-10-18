import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Tiro_Devanagari_Hindi } from "next/font/google";
import localFont from "next/font/local";
import { siteConfig } from "@/site.config";
import "./globals.css";

// Newsreader, self-hosted: weight 400 with the optical-size axis kept (opsz 20–72), Latin + ₹,
// cut from Google Fonts' OFL source with fontTools: ~40 KB per style instead of ~130 KB. See app/fonts/README.md.
const newsreader = localFont({
  src: [{ path: "./fonts/newsreader-roman.woff2", weight: "400", style: "normal" }],
  display: "swap",
  variable: "--font-newsreader",
  adjustFontFallback: "Times New Roman",
});

// Italic accent words appear in most page headings, so the (small) italic cut is preloaded too.
const newsreaderItalic = localFont({
  src: [{ path: "./fonts/newsreader-italic.woff2", weight: "400", style: "italic" }],
  display: "swap",
  variable: "--font-newsreader-italic",
  adjustFontFallback: "Times New Roman",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

// One decorative use in the hero; not preloaded.
const tiroDeva = Tiro_Devanagari_Hindi({
  subsets: ["devanagari"],
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-tiro-deva",
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
  themeColor: "#fbf8f3",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${newsreader.variable} ${newsreaderItalic.variable} ${hanken.variable} ${plexMono.variable} ${tiroDeva.variable}`}
    >
      <head>
        {/* Without JS, revealed content must still be visible. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
