/**
 * Document shell (the Astro version's Base.astro): <head> (font preload,
 * icons, global styles), the kit settings, the consent banner and the
 * scripts. Pages render <Site> (header, menu, footer, SEO).
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useLocation, useRouteError, useRouteLoaderData } from 'react-router';
// Archivo, subset by scripts/font-subset.sh (@font-face in styles/global.css).
import archivo from './fonts/archivo-wdth62-100-wght400-850-latin.woff2?url';
import '@realadvisor/sites-kit-react/styles/kit.css';
import './styles/global.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit/image';
import { agency, sites } from './lib/data.server';
import { brandName } from './lib/data';
import { LOCALE_OF, langOfPath } from './lib/i18n';
import NotFound, { ServerError } from './routes/404';

export async function loader() {
  const [kit, ag] = await Promise.all([kitData(), agency()]);
  // og:image on every page: the agency logo, else (an agency without a logo) the latest listing's first photo.
  const ogFallback = async () => {
    if (ag.org.logo?.url) return img(ag.org.logo.url, { w: 1200, h: 630, fit: 'fit' });
    const photo = (await sites.listings({ limit: 1 })).data[0]?.photos[0]?.url;
    return photo ? img(photo, { w: 1200, h: 630 }) : undefined;
  };
  const team = ag.team;
  return {
    kit,
    site: {
      name: brandName(ag),
      orgName: ag.org.name,
      phone: team?.phone,
      email: team?.email,
      address: team?.address ?? ag.org.address,
      description: team?.description_text,
      ogImage: await ogFallback().catch(() => undefined),
    },
  };
}
export type RootData = Awaited<ReturnType<typeof loader>>;

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData('root') as RootData | undefined;
  const locale = LOCALE_OF[langOfPath(useLocation().pathname)];
  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={archivo} />
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
