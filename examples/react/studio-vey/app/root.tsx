/**
 * Document shell: <head> (fonts, global styles, icons), the kit settings,
 * the consent banner and the scripts. Pages render <Layout> (header, footer, SEO).
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useRouteError, useRouteLoaderData } from 'react-router';
import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/instrument-sans/wght.css';
import serifFont from '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2?url';
import '@realadvisor/sites-kit-react/styles/kit.css';
import './styles/global.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { LOCALE } from '@realadvisor/sites-kit/format';
import { img } from '@realadvisor/sites-kit/image';
import { areas, brandName, site, sites } from './lib/data.server';
import NotFound, { ServerError } from './routes/404';

export async function loader() {
  const [kit, s, places] = await Promise.all([kitData(), site(), areas()]);
  const ogFallback = async () => {
    if (s.org.logo?.url) return img(s.org.logo.url, { w: 1200, h: 630, fit: 'fit' });
    const photo = (await sites.listings({ status: 'available', limit: 1 })).data[0]?.photos[0]?.url;
    return photo ? img(photo, { w: 1200, h: 630 }) : undefined;
  };
  return {
    kit,
    layout: { brand: brandName(s), orgName: s.org.name, team: s.team, places, ogImage: await ogFallback().catch(() => undefined) },
  };
}
export type RootData = Awaited<ReturnType<typeof loader>>;

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  return (
    <html lang={LOCALE}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={serifFont} />
        {/* Guard: nothing may undo `hidden` (an invisible open menu layer blocks every click). Never remove. */}
        <style>{'[hidden]{display:none!important}'}</style>
        <Meta />
        <Links />
      </head>
      <body>
        <KitProvider value={data?.kit}>
          {children}
          <ConsentBanner locale={LOCALE} />
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
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound gone={error.status === 410} />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
