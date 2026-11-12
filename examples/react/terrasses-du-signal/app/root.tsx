/**
 * Document shell: <head> (fonts, global styles, icons), the kit settings,
 * the consent banner and the scripts. Pages render <Layout> (header, footer, SEO).
 */
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, useRouteError, useRouteLoaderData } from 'react-router';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource-variable/manrope/wght.css';
import serif500 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2?url';
import serifItalic from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2?url';
import sans from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url';
import './styles/global.css';
// After global.css, as in the Astro build (its form.css comes last): the kit's control tokens win (--control-h 48px).
// The kit's form controls and the consent banner only: no listings search, pager or map on this site (kit.css minus those).
import '@realadvisor/sites-kit/styles/form.css';
import '@realadvisor/sites-kit-react/styles/consent.css';
import { KitProvider, KitScripts } from '@realadvisor/sites-kit-react/components/Document';
import { ConsentBanner } from '@realadvisor/sites-kit-react/components/ConsentBanner';
import { kitData } from '@realadvisor/sites-kit-react/server/kit';
import { LOCALE } from '@realadvisor/sites-kit/format';
import { loadSite } from './lib/data.server';
import NotFound, { ServerError } from './routes/404';

/** What the header and footer show, on every page. */
export type Shell = {
  title: string;
  city?: string | null;
  devPlace: string[];
  orgName: string;
  office: string[];
  phone?: string;
  email?: string;
  /** Developer, architect, general contractor. */
  credits: [string, string][];
};

export async function loader() {
  const [kit, s] = await Promise.all([kitData(), loadSite()]);
  const { dev, org, team } = s;
  const shell: Shell = {
    title: dev.title,
    city: dev.address.city,
    devPlace: [dev.address.street, [dev.address.postcode, dev.address.city].filter(Boolean).join(' ')].filter((x): x is string => !!x),
    orgName: org.name,
    office: [org.address?.street, [org.address?.postcode, org.address?.city].filter(Boolean).join(' ')].filter((x): x is string => !!x),
    phone: team?.phone ?? undefined,
    email: team?.email ?? undefined,
    credits: (
      [
        ['Maître d’ouvrage', dev.developer?.name],
        ['Architecte', dev.architect?.name],
        ['Entreprise générale', dev.general_contractor?.name],
      ] as [string, string | undefined][]
    ).filter((c): c is [string, string] => !!c[1]),
  };
  return { kit, shell };
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
        {/* Guard: nothing may undo `hidden` (an invisible open menu layer blocks every click). Never remove. */}
        <style>{'[hidden]{display:none!important}'}</style>
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={serif500} />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href={serifItalic} />
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

/** 404 (a route's answer) gets the site's not-found page; anything else a short error page. */
export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && (error.status === 404 || error.status === 410)) return <NotFound />;
  if (!isRouteErrorResponse(error)) console.error(error);
  return <ServerError />;
}
