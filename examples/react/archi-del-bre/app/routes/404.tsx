/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown unit), keeping the status. Also the splat route (`*`).
 * Language from the URL.
 */
import { useLocation, useRouteLoaderData } from 'react-router';
import { t } from '@realadvisor/sites-kit/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import type { RootData } from '../root';
import { Layout } from '../components/Layout';
import { href, langOf } from '../lib/routes';
import { c } from '../lib/copy';
import './404.css';

export function loader(): never {
  throw notFound();
}

export default function NotFound() {
  const l = langOf(useLocation().pathname);
  const dev = (useRouteLoaderData('root') as RootData | undefined)?.site.dev;
  const title = t('notFound', {}, l);
  return (
    <Layout l={l} route="404" scope="v-404" title={dev ? `${title} | ${dev.title}` : title} description={title} noindex>
      <div className="wrap nf">
        <h1 className="h1">{title}</h1>
        <p className="lede">{t('notFoundText', {}, l)}</p>
        <p className="actions"><a className="btn" href={href('units', l)}>{c('units', l)}</a> <a className="link" href={href('home', l)}>{dev?.title}</a></p>
      </div>
    </Layout>
  );
}

export function ServerError() {
  const l = langOf(useLocation().pathname);
  const title = l === 'de' ? 'Seite vorübergehend nicht verfügbar' : 'Pagina temporaneamente non disponibile';
  return (
    <Layout l={l} route="404" scope="v-404" title={title} description={title} noindex>
      <div className="wrap nf">
        <h1 className="h1">{title}</h1>
        <p className="lede">{l === 'de' ? 'Bitte versuchen Sie es in einigen Minuten erneut.' : 'Riprova tra qualche minuto.'}</p>
        <p className="actions"><a className="link" href={href('home', l)}>{t('home', {}, l)}</a></p>
      </div>
    </Layout>
  );
}
