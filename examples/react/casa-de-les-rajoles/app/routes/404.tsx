/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown unit), keeping the status. Also the splat route (`*`).
 * Language from the path: /en/... gets the English page.
 */
import { useLocation, useRouteLoaderData } from 'react-router';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { Tiles } from '../components/Tiles';
import { alternates, href, langOfPath, tr } from '../lib/i18n';
import type { RootData } from '../root';
import './404.css';

export function loader(): never {
  throw notFound();
}

export default function NotFound() {
  const lang = langOfPath(useLocation().pathname);
  const t = tr(lang);
  const title = (useRouteLoaderData('root') as RootData | undefined)?.layout.dev.title ?? '';
  return (
    <Layout lang={lang} title={`${t.notFound} | ${title}`} description={t.notFoundText} noindex alternates={alternates('home')} page="pg-404">
      <div className="wrap nf">
        <h1>{t.notFound}</h1>
        <p className="lede">{t.notFoundText}</p>
        <p className="links"><a className="cta" href={href('units', lang)}>{t.nav.units}</a> <a className="cta ghost" href={href('home', lang)}>{t.backHome}</a></p>
      </div>
      <Tiles id="tiles-404" size={32} />
    </Layout>
  );
}

export function ServerError() {
  const lang = langOfPath(useLocation().pathname);
  const es = lang === 'es';
  const title = es ? 'Página no disponible temporalmente' : 'Page temporarily unavailable';
  return (
    <Layout lang={lang} title={title} description={title} noindex alternates={alternates('home')} page="pg-404">
      <div className="wrap nf">
        <h1>{title}</h1>
        <p className="lede">{es ? 'Vuelva a intentarlo en unos minutos.' : 'Please try again in a few minutes.'}</p>
        <p className="links"><a className="cta ghost" href={href('home', lang)}>{tr(lang).backHome}</a></p>
      </div>
    </Layout>
  );
}
