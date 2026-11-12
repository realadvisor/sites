/**
 * Document shell: <head> (fonts, global styles, icons), the kit settings,
 * the consent banner and the scripts. Pages render <Layout> (header, footer,
 * tab bar, SEO). The page language comes from the path (/en: English).
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useLocation, useRouteError, useRouteLoaderData } from 'react-router';
import '@fontsource/libre-caslon-text/latin-400.css';
import '@fontsource-variable/instrument-sans/wght.css';
import serif400 from '@fontsource/libre-caslon-text/files/libre-caslon-text-latin-400-normal.woff2?url';
import sans from '@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2?url';
import '@realadvisor/sites-kit-react/styles/kit.css';
import './styles/global.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { loadSite } from './lib/data.server';
import { LOCALE_OF, langOfPath } from './lib/i18n';
import NotFound, { ServerError } from './routes/404';

export async function loader() {
  const [kit, s] = await Promise.all([kitData(), loadSite()]);
  const { dev, org, team } = s;
  return {
    kit,
    layout: {
      dev: { title: dev.title, address: dev.address },
      org: { name: org.name, address: org.address },
      team: team && { phone: team.phone, email: team.email },
      developer: dev.developer?.name,
    },
  };
}
export type RootData = Awaited<ReturnType<typeof loader>>;
export type LayoutData = RootData['layout'];

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
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={serif400} />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={sans} />
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

/** 404 (an unknown path or unit) gets the site's not-found page; anything else a short error page. */
export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
