/**
 * Document shell: <head> (fonts, global styles, icons), the kit settings,
 * the consent banner and the scripts. Pages render <Layout> (header,
 * programme bar, footer, SEO) with the data of this loader.
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useRouteError, useRouteLoaderData } from 'react-router';
import './styles/fonts.css';
import '@fontsource-variable/jost/wght.css';
import serif500 from './fonts/cormorant-garamond-500-normal-lf.woff2?url';
import sans from '@fontsource-variable/jost/files/jost-latin-wght-normal.woff2?url';
import './styles/tokens.css';
import './styles/global.css';
// After the site's styles, as in the Astro build (the kit's form.css sets --control-h: 48px last).
import '@realadvisor/sites-kit-react/styles/kit.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { LOCALE } from '@realadvisor/sites-kit/format';
import { img } from '@realadvisor/sites-kit/image';
import { primaryTeam, programmes, sites } from './lib/data.server';
import NotFound, { ServerError } from './routes/404';

export async function loader() {
  const [kit, org, team, all] = await Promise.all([kitData(), sites.organisation(), primaryTeam(), programmes()]);
  const ogFallback = async () => {
    if (org.logo?.url) return img(org.logo.url, { w: 1200, h: 630, fit: 'fit' });
    const photo = (await sites.developments())[0]?.photos[0]?.url;
    return photo ? img(photo, { w: 1200, h: 630 }) : undefined;
  };
  return {
    kit,
    layout: {
      name: team?.name ?? org.name,
      legalName: org.name,
      team,
      // Header, footer and 404: what they show of each programme.
      programmes: all.map((d) => ({ id: d.id, slug: d.slug, title: d.title, status: d.status, address: { city: d.address.city } })),
      ogImage: await ogFallback().catch(() => undefined),
    },
  };
}
export type RootData = Awaited<ReturnType<typeof loader>>;
export type ProgrammeLink = RootData['layout']['programmes'][number];

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
        {/* Guard: nothing may undo `hidden` (an invisible open menu layer blocks every click). Never remove. */}
        <style>{'[hidden]{display:none!important}'}</style>
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={serif500} />
        {/* Also the body font (not in the Astro version): without it the lot pages shift when Jost swaps in (CLS 0.22 on mobile). */}
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={sans} />
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
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
