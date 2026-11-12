/**
 * Document shell (the Astro version's Base.astro): <head> (fonts, icons,
 * global styles), the kit settings, the consent banner and the scripts.
 * Pages render <Site> (header, footer, SEO). The page language comes from
 * the path (/fr French, /en English, else German).
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useLocation, useRouteError, useRouteLoaderData } from 'react-router';
import '@fontsource-variable/literata/wght.css';
import '@fontsource-variable/public-sans/wght.css';
import serifUrl from '@fontsource-variable/literata/files/literata-latin-wght-normal.woff2?url';
import sansUrl from '@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2?url';
import './styles/global.css';
// After global.css, as in the Astro build (its form.css comes after the site's styles).
import '@realadvisor/sites-kit-react/styles/kit.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit-core/image';
import { siteData, sites } from './lib/data.server';
import { LOCALE, langOfPath } from './lib/routes';
import type { LayoutData } from './components/Site';
import { NotFoundPage, ServerError } from './routes/404';

export async function loader() {
  const [kit, { org, teams }, developments] = await Promise.all([kitData(), siteData(), sites.developments()]);
  // og:image fallback on every page: the newest available listing's first photo.
  const ogFallback = async () => {
    const photo = (await sites.listings({ limit: 1, status: 'available' })).data[0]?.photos[0]?.url;
    return photo ? img(photo, { w: 1200, h: 630 }) : undefined;
  };
  const layout: LayoutData = {
    org: { name: org.name, logo: org.logo?.url ? { url: org.logo.url } : null },
    teams: teams.map(({ id, name, address, phone, email }) => ({ id, name, address, phone, email })),
    hasDevelopments: developments.length > 0,
    ogImage: await ogFallback().catch(() => undefined),
  };
  return { kit, layout };
}
export type RootData = Awaited<ReturnType<typeof loader>>;

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const locale = LOCALE[langOfPath(useLocation().pathname)];
  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={serifUrl} />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={sansUrl} />
        {/* Guard: nothing may undo `hidden` (an invisible open menu layer blocks every click). Never remove. */}
        <style>{'[hidden]{display:none!important}'}</style>
        <Meta />
        <Links />
      </head>
      <body>
        <KitProvider value={data?.kit}>
          {children}
          <ConsentBanner locale={locale} />
        </KitProvider>
        <KitScripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/** 404 and 410 (a route's answer) get the site's not-found page; anything else a short error page. */
export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFoundPage gone={error.status === 410} />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
