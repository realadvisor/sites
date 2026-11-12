/**
 * Document shell: <head> (fonts, global styles, icons), the kit settings,
 * the consent banner and the scripts. Pages render <Layout> (SEO, header,
 * footer). The language (French, German under /de) comes from the path.
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useLocation, useRouteError, useRouteLoaderData } from 'react-router';
import '@fontsource-variable/source-serif-4/wght.css';
import '@fontsource-variable/hanken-grotesk/wght.css';
import serifUrl from '@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2?url';
import sansUrl from '@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2?url';
import './styles/global.css';
// After global.css, as the Astro layout imports the kit's components: the kit's values win (--control-h 48px).
import '@realadvisor/sites-kit-react/styles/kit.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit-core/image';
import { areaList, siteData, sites } from './lib/data.server';
import { langOf, LOCALE } from './lib/routes';
import NotFound, { ServerError } from './routes/404';

export async function loader() {
  const [kit, { org, teams }, developments, areas] = await Promise.all([kitData(), siteData(), sites.developments(), areaList()]);
  const ogFallback = async () => {
    const photo = (await sites.listings({ limit: 1, status: 'available' })).data[0]?.photos[0]?.url;
    return photo ? img(photo, { w: 1200, h: 630 }) : undefined;
  };
  return {
    kit,
    layout: {
      org: { id: org.id, name: org.name, logo: org.logo },
      teams,
      hasDevelopments: developments.length > 0,
      areas: areas.map(({ slug, city }) => ({ slug, city })),
      ogImage: await ogFallback().catch(() => undefined),
    },
  };
}
export type RootData = Awaited<ReturnType<typeof loader>>;

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const locale = LOCALE[langOf(useLocation().pathname)];
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
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
