/**
 * Footer: the development and its address, the sales office (primary team),
 * the people behind it, nav, languages and the legal links
 * in the page's language (kit legalPath / privacyPath).
 */
import { legalPath, privacyPath, t } from '@realadvisor/sites-kit-core/i18n';
import type { Site } from '../lib/data.server';
import { href, LOCALE, tel, type L } from '../lib/routes';
import { c } from '../lib/copy';
import './Footer.css';

export function Footer({ site, l, alternates }: { site: Site; l: L; alternates?: { lang: string; href: string }[] }) {
  const { dev, team, org } = site;
  const credits = [
    [c('developer', l), dev.developer?.name],
    [c('architect', l), dev.architect?.name],
    [c('contractor', l), dev.general_contractor?.name],
  ].filter((x): x is [string, string] => !!x[1]);
  const a = dev.address;
  const office = team?.address ?? org.address;
  const langs = (['it', 'de'] as const).map((x) => ({ l: x, href: alternates?.find((y) => y.lang === LOCALE[x])?.href ?? href('home', x), name: x === 'it' ? 'Italiano' : 'Deutsch' }));
  return (
    <footer className="site-footer">
      <div className="wrap grid">
        <div className="intro">
          <p className="name">{dev.title}</p>
          <p className="muted">{[a.street, [a.postcode, a.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</p>
        </div>
        <div>
          <h2 className="label">{c('salesOffice', l)}</h2>
          <p>{team?.name ?? org.name}</p>
          {office && <p className="muted">{office.street}, {office.postcode} {office.city}</p>}
          <p className="lines">
            {team?.phone && <a href={tel(team.phone)}>{team.phone}</a>}
            {team?.email && <a href={`mailto:${team.email}`}>{team.email}</a>}
          </p>
        </div>
        {credits.length > 0 && (
          <dl className="credits">
            {credits.map(([k, v]) => <div key={k}><dt className="label">{k}</dt><dd>{v}</dd></div>)}
          </dl>
        )}
        <nav aria-label={c('mainNav', l)} className="links">
          <ul>
            <li><a href={href('units', l)}>{c('units', l)}</a></li>
            <li><a href={href('location', l)}>{c('location', l)}</a></li>
            <li><a href={href('gallery', l)}>{c('gallery', l)}</a></li>
            <li><a href={href('documents', l)}>{c('documents', l)}</a></li>
            <li><a href={href('contact', l)}>{c('contact', l)}</a></li>
          </ul>
        </nav>
      </div>
      <div className="wrap base">
        <p>© {new Date().getFullYear()} {org.name}</p>
        <ul className="legal">
          <li><a href={legalPath(LOCALE[l])}>{t('legalNotice', {}, l)}</a></li>
          <li><a href={privacyPath(LOCALE[l])}>{t('privacyPolicy', {}, l)}</a></li>
        </ul>
        <ul className="legal" aria-label={c('language', l)}>
          {langs.map((x) => <li key={x.l}><a href={x.href} hrefLang={LOCALE[x.l]} lang={LOCALE[x.l]} aria-current={x.l === l ? 'true' : undefined}>{x.name}</a></li>)}
        </ul>
      </div>
    </footer>
  );
}
