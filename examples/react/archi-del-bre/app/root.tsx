/**
 * Document shell: <head> (fonts, global styles, icons), the kit settings,
 * the consent banner and the scripts. Pages render <Layout> (header, footer, SEO).
 * The language follows the path (/de: German, else Italian).
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useLocation, useRouteError, useRouteLoaderData } from 'react-router';
import type { Route } from './+types/root';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource-variable/figtree/wght.css';
import serif from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url';
import sans from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url';
import './styles/global.css';
// After global.css, as in the Astro build: the kit's form controls and buttons win over the site's .btn.
import '@realadvisor/sites-kit-react/styles/kit.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { loadSite } from './lib/data.server';
import { langOf, LOCALE } from './lib/routes';
import NotFound, { ServerError } from './routes/404';

export async function loader({ request }: Route.LoaderArgs) {
  const [kit, site] = await Promise.all([kitData(), loadSite(request)]);
  return { kit, site };
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
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={serif} />
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

/** 404 (unknown path, unknown unit) gets the site's not-found page with its status; anything else a short error page. */
export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
