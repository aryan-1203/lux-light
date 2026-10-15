import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { BRAND_NAME, TAGLINE } from '@/config/brand';
import { env } from '@/config/env';

export interface SeoProps {
  /** Rendered as `${title} · ${BRAND_NAME}` (home: brand + tagline). */
  title: string;
  /** ≤ 160 chars. */
  description: string;
  /** Path ('/products/x') or absolute URL; default = current path on VITE_SITE_URL. */
  canonical?: string;
  /** Absolute or /path; default /og/default.jpg. */
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

function absolute(urlOrPath: string): string {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  return `${env.siteUrl}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;
}

/** Per-page meta, Open Graph, canonical and JSON-LD (PLAN §4.2). Organization JSON-LD lives in AppShell. */
export default function Seo(props: SeoProps): JSX.Element {
  const {
    title,
    description,
    canonical,
    ogImage,
    ogType = 'website',
    jsonLd,
    noindex = false,
  } = props;
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const fullTitle = isHome ? `${BRAND_NAME} · ${TAGLINE}` : `${title} · ${BRAND_NAME}`;
  const url = absolute(canonical ?? pathname);
  const image = absolute(ogImage ?? '/og/default.jpg');
  const desc = description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="en_IN" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify({ '@context': 'https://schema.org', ...obj })}
        </script>
      ))}
    </Helmet>
  );
}
