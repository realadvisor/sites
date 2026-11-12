/** Numbered pages of ListingsSearch (port of ListingsPager.astro). */
import { pageList, type SearchResult } from '@realadvisor/sites-kit-core/search';
import { usePageLocale } from './Document';
import { lang, t } from '@realadvisor/sites-kit-core/i18n';

export function ListingsPager({ result, href, locale }: { result: SearchResult; href: (over: { page?: number }) => string; locale?: string }) {
  const l = lang(locale ?? usePageLocale());
  if (!(result.pages > 1 && result.total > 0)) return null;
  const pages = pageList(result.page, result.pages);
  return (
    <nav className="rs-pager" data-rs-pager="" aria-label={t('pagination', {}, l)}>
      {result.page > 1 ? (
        <a className="rs-step" href={href({ page: result.page - 1 > 1 ? result.page - 1 : undefined })} rel="prev" data-rs-nav="">‹ <span>{t('prevPage', {}, l)}</span></a>
      ) : <span className="rs-step" aria-hidden="true"></span>}
      <ol>
        {pages.map((n, i) => n == null ? <li key={`g${i}`} className="rs-gap" aria-hidden="true">…</li> : (
          <li key={n}><a href={href({ page: n > 1 ? n : undefined })} data-rs-nav="" aria-current={n === result.page ? 'page' : undefined} aria-label={`${t('page', {}, l)} ${n}`}>{n}</a></li>
        ))}
      </ol>
      {result.page < result.pages ? (
        <a className="rs-step" href={href({ page: result.page + 1 })} rel="next" data-rs-nav=""><span>{t('nextPage', {}, l)}</span> ›</a>
      ) : <span className="rs-step" aria-hidden="true"></span>}
    </nav>
  );
}
