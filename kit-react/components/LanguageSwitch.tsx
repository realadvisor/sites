/**
 * Language links of a multi-language site: one <a hreflang> per version of
 * this page (the same `alternates` the page gives <Seo>), the current one
 * aria-current. Single-language sites render nothing.
 */
import { lang } from '@realadvisor/sites-kit-core/i18n';

export function LanguageSwitch({ alternates, locale, className }: { alternates: { lang: string; href: string }[]; locale: string; className?: string }) {
  if (alternates.length < 2) return null;
  return (
    <nav className={['lang-switch', className].filter(Boolean).join(' ')} aria-label="Language">
      <ul>
        {alternates.map((a) => (
          <li key={a.lang}>
            <a href={a.href} hrefLang={a.lang} lang={a.lang} aria-current={a.lang === locale ? 'true' : undefined}>{lang(a.lang).toUpperCase()}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Alternates of one page in every locale: `localePath(path, locale)` per language. */
export { localePath } from '@realadvisor/sites-kit-core/i18n';
