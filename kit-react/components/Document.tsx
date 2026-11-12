/**
 * Document parts every root.tsx uses: the request nonce, the kit settings
 * (mode, analytics, Turnstile), the scripts, the SEO head and JSON-LD.
 *
 *   export function Layout({ children }) {
 *     const data = useRouteLoaderData<typeof loader>('root');
 *     return (
 *       <html lang={usePageLocale()}>
 *         <head><meta charSet="utf-8" /><meta name="viewport" … /><Meta /><Links /></head>
 *         <body>
 *           <KitProvider value={data?.kit}>{children}<ConsentBanner /></KitProvider>
 *           <KitScripts />
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * Scripts: a route is static HTML plus the site's one bundled script
 * (app/client.ts: kit behaviours, islands) unless its `handle` says
 * `{ hydrate: true }`; then React Router's own scripts render, with the
 * request nonce (the CSP allows no other inline script).
 */
import { createContext, useContext, type ReactNode } from 'react';
import { isRouteErrorResponse, Scripts, ScrollRestoration, useLocation, useMatches, useRouteError } from 'react-router';
import { localeOfPath } from '@realadvisor/sites-kit-core/i18n';
import client from 'virtual:sites-kit-react/client';
import { safeJsonLd } from '@realadvisor/sites-kit-core/seo';

/** The request's CSP nonce (server only; the browser hides it). */
export const NonceContext = createContext<string | undefined>(undefined);
export const useNonce = () => useContext(NonceContext);

/** What the kit parts need from the request: from `kitData()` in the root loader. */
export type KitData = {
  /** `preview` unless SITE_MODE says production: previews never send enquiries. */
  mode: 'production' | 'preview';
  /** GA4 id: the consent banner shows only when set. */
  analyticsId?: string;
  /** Turnstile site key for EnquiryForm (`fixture`: a stand-in that never loads Turnstile). */
  turnstileSiteKey: string | null;
  /** Public origin (SITE_URL): canonical, OG and sitemap URLs. */
  siteUrl: string;
};

const DEFAULT: KitData = { mode: 'preview', turnstileSiteKey: null, siteUrl: 'https://example.realadvisor.site' };
const KitContext = createContext<KitData>(DEFAULT);
export const useKit = () => useContext(KitContext);
export function KitProvider({ value, children }: { value?: KitData; children: ReactNode }) {
  return <KitContext.Provider value={value ?? DEFAULT}>{children}</KitContext.Provider>;
}

/**
 * The page's locale from its path: site.json `locales`, the default one on
 * unprefixed URLs, `/fr/…` for fr-CH and so on (the Astro kit's localeOfPath).
 * For `<html lang>`, og:locale (Seo), the consent banner, the enquiry form
 * and the listings search, which all default to it. Loaders: `pageLocale(request)`
 * from `…/server/kit`.
 */
export function usePageLocale(): string {
  return localeOfPath(useLocation().pathname);
}

type Handle = { hydrate?: boolean } | undefined;

/** True when a matched route asks for React hydration (`export const handle = { hydrate: true }`). */
export function useHydrate(): boolean {
  return useMatches().some((m) => (m.handle as Handle)?.hydrate === true);
}

/**
 * End of <body>. Static routes: the site's bundled script (a file: 'self'),
 * nothing inline. Hydrated routes: React Router's scripts with the nonce
 * (app/entry.client.tsx imports app/client.ts itself there).
 */
export function KitScripts() {
  const nonce = useNonce();
  const hydrate = useHydrate();
  // Dev only (the CRM preview's bridge): empty in a build.
  const dev = (client.dev ?? []).map((src) => <script key={src} type="module" src={src} nonce={nonce} />);
  if (hydrate) {
    return (
      <>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        {dev}
      </>
    );
  }
  if (!client.src) return <>{dev}</>;
  return (
    <>
      {client.preload.map((href) => (
        <link key={href} rel="modulepreload" href={href} />
      ))}
      <script type="module" src={client.src} nonce={nonce} />
      {dev}
    </>
  );
}

/**
 * The 404 / 410 page: read the status from the route error, never from a
 * prop. React Router wraps a route module's default export and drops the
 * props it is given, so `<NotFound gone />` from the root ErrorBoundary
 * arrives without `gone` when NotFound is routes/404.tsx's default export.
 *
 *   export default function NotFound() {
 *     const gone = useGone(); // true on a 410 (`throw notFound(true)`)
 *     ...
 *   }
 *   // root.tsx
 *   export function ErrorBoundary() {
 *     const error = useRouteError();
 *     if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound />;
 *     ...
 *   }
 */
export function useErrorStatus(): number | undefined {
  const error = useRouteError();
  return isRouteErrorResponse(error) ? error.status : undefined;
}
/** True when the page answers a 410 (a listing that left the site). */
export const useGone = () => useErrorStatus() === 410;

/** JSON-LD (escaped by the kit's safeJsonLd, so data never closes the tag). */
export function JsonLd({ data }: { data: unknown }) {
  const nonce = useNonce();
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />;
}

export type SeoProps = {
  title: string;
  description: string;
  /** Absolute URL, about 1200x630: the page's main photo. */
  image?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  /** Every language version of this page: hreflang links (and x-default = the first). */
  alternates?: { lang: string; href: string }[];
  /** The page's locale (og:locale). Default: the path's (`usePageLocale()`). */
  locale?: string;
  /** Canonical URL (canonicalUrl() of the request URL on SITE_URL). */
  canonical: string;
  themeColor?: string;
};

/**
 * Title, description, canonical, hreflang, robots, Open Graph and JSON-LD.
 * React 19 hoists the tags into <head> wherever the page renders it.
 */
export function Seo({ title, description, image, jsonLd, noindex, alternates, locale: localeProp, canonical, themeColor }: SeoProps) {
  const pathLocale = usePageLocale();
  const locale = localeProp ?? pathLocale;
  const base = new URL(canonical).origin;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {alternates?.map((a) => <link key={a.lang} rel="alternate" hrefLang={a.lang} href={new URL(a.href, base).href} />)}
      {alternates?.[0] && <link rel="alternate" hrefLang="x-default" href={new URL(alternates[0].href, base).href} />}
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={locale.replace('-', '_')} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      {themeColor && <meta name="theme-color" content={themeColor} />}
      {jsonLd && <JsonLd data={jsonLd} />}
    </>
  );
}
