/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown unit), keeping the status. Also the splat route (`*`).
 */
import { t } from '@realadvisor/sites-kit-core/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { useRouteLoaderData } from 'react-router';
import { Layout } from '../components/Layout';
import type { RootData } from '../root';
import './404.css';

export function loader(): never {
  throw notFound();
}

export default function NotFound() {
  const title = t('notFound');
  const dev = (useRouteLoaderData('root') as RootData | undefined)?.shell.title;
  return (
    <Layout title={dev ? `${title} | ${dev}` : title} description={t('notFoundText')} noindex>
      <div className="wrap nf">
        <p className="eyebrow">Erreur 404</p>
        <h1>{title}</h1>
        <p className="lede">{t('notFoundText')}</p>
        <p className="actions">
          <a className="button" href="/appartements">Voir les appartements</a>
          <a className="button ghost" href="/">{t('home')}</a>
        </p>
      </div>
    </Layout>
  );
}

export function ServerError() {
  const title = 'Page momentanément indisponible';
  return (
    <Layout title={title} description={title} noindex>
      <div className="wrap nf">
        <h1>{title}</h1>
        <p className="lede">Merci de réessayer dans quelques minutes.</p>
        <p className="actions"><a className="button ghost" href="/">{t('home')}</a></p>
      </div>
    </Layout>
  );
}
