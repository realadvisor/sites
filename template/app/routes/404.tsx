/**
 * Not-found page: the root ErrorBoundary renders it for every 404 (unknown
 * path, unknown listing) and 410 (a listing that left the site, with the
 * "no longer available" text), keeping the status. Also the splat route.
 * Design it like the other pages (it renders <Layout>).
 */
import { usePageLocale, useGone } from '@realadvisor/sites-kit-react/components/Document';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { lang, localePath, t } from '@realadvisor/sites-kit-core/i18n';
import { serverErrorText } from '@realadvisor/sites-kit-core/render-error';
import { Layout } from '../components/Layout';

export function loader(): never {
  throw notFound();
}

export default function NotFound() {
  const gone = useGone();
  const locale = usePageLocale();
  const l = lang(locale);
  const title = gone ? t('listingGone', {}, l) : t('notFound', {}, l);
  return (
    <Layout title={title} description={title} noindex>
      <h1>{title}</h1>
      <p>{gone ? t('listingGoneText', {}, l) : t('notFoundText', {}, l)}</p>
      <p><a href={localePath('/listings', locale)}>{t('allListings', {}, l)}</a> · <a href={localePath('/', locale)}>{t('home', {}, l)}</a></p>
    </Layout>
  );
}

/** Any other error (a failed loader): a short page, answered with a 500. */
export function ServerError() {
  const { title, body, home } = serverErrorText(lang(usePageLocale()));
  return (
    <Layout title={title} description={title} noindex>
      <h1>{title}</h1>
      <p>{body}</p>
      <p><a href="/">{home}</a></p>
    </Layout>
  );
}
