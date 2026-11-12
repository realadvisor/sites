/**
 * Document shell: <head> (font, global styles, icons), the kit settings, the
 * consent banner and the scripts. Pages render <Layout> (header, footer, SEO).
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useRouteError, useRouteLoaderData } from 'react-router';
import '@fontsource-variable/onest/wght.css';
import fontUrl from '@fontsource-variable/onest/files/onest-latin-wght-normal.woff2?url';
import '@realadvisor/sites-kit-react/styles/kit.css';
import './styles/global.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit-core/image';
import { siteData, sites } from './lib/data.server';
import { NotFoundPage, ServerError } from './routes/404';

const LOCALE = 'fr-FR';

export async function loader() {
  const [kit, s] = await Promise.all([kitData(), siteData()]);
  const ogFallback = async () => {
    const photo = (await sites.listings({ limit: 1, status: 'available' })).data[0]?.photos[0]?.url;
    return photo ? img(photo, { w: 1200, h: 630 }) : undefined;
  };
  return {
    kit,
    layout: {
      orgName: s.org.name,
      teams: s.teams.map((t) => ({ id: t.id, name: t.name, address: t.address, phone: t.phone })),
      ogImage: await ogFallback().catch(() => undefined),
    },
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
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={fontUrl} />
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
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFoundPage gone={error.status === 410} />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
