/**
 * Document shell: <head>, the kit settings, the consent banner and the
 * scripts. No design here on purpose: pages render <Layout> (SEO, header,
 * footer), which you design (DESIGN.md).
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useRouteError, useRouteLoaderData } from 'react-router';
// The site's CSS first (import './styles/global.css' here), then the kit's.
import '@realadvisor/sites-kit-react/styles/kit.css';
import { KitProvider, KitScripts, usePageLocale } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit-core/image';
import { agency, sites } from './lib/data.server';
import NotFound, { ServerError } from './routes/404';

export async function loader() {
  const [kit, a] = await Promise.all([kitData(), agency()]);
  // og:image on every page (link previews need it): the agency logo, else the latest listing's first photo.
  const ogFallback = async () => {
    if (a.logo?.url) return img(a.logo.url, { w: 1200, h: 630, fit: 'fit' });
    const photo = (await sites.listings({ status: 'available', limit: 1 })).data[0]?.photos[0]?.url;
    return photo ? img(photo, { w: 1200, h: 630 }) : undefined;
  };
  return { kit, agency: a, ogImage: await ogFallback().catch(() => undefined) };
}
export type RootData = Awaited<ReturnType<typeof loader>>;

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const locale = usePageLocale();
  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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

/** 404 and 410 (a route's `throw notFound()`) get the site's not-found page; anything else a short error page. */
export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
