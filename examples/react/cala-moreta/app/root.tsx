/**
 * Document shell: <head> (fonts, global styles, icons), the kit settings,
 * the consent banner and the scripts. Pages render <Site> (header, footer, SEO).
 * The page language comes from the path: Spanish unprefixed, English under /en.
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useLocation, useRouteError, useRouteLoaderData } from 'react-router';
import '@fontsource/fraunces/latin-300.css';
import '@fontsource/fraunces/latin-300-italic.css';
import '@fontsource/fraunces/latin-400.css';
import '@fontsource/jost/latin-400.css';
import '@fontsource/jost/latin-500.css';
import fraunces300 from '@fontsource/fraunces/files/fraunces-latin-300-normal.woff2?url';
import jost400 from '@fontsource/jost/files/jost-latin-400-normal.woff2?url';
import '@realadvisor/sites-kit-react/styles/kit.css';
import './styles/global.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { agency, brandName } from './lib/data.server';
import { LOCALE_OF, langOfPath } from './lib/i18n';
import NotFound, { ServerError } from './routes/404';

export async function loader() {
  const [kit, ag] = await Promise.all([kitData(), agency()]);
  const { org, team } = ag;
  const addr = org.address ?? team?.address;
  return {
    kit,
    site: {
      name: brandName(ag),
      orgName: org.name,
      phone: team?.phone ?? undefined,
      email: team?.email ?? undefined,
      addr: addr ? { street: addr.street, postcode: addr.postcode, city: addr.city } : undefined,
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
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={fraunces300} />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={jost400} />
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
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound gone={error.status === 410} />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
