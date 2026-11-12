/**
 * Navy footer: wordmark and one line, one column per office (address, phone,
 * email), the site map, area links, then the legal line with the kit's legal
 * paths and labels in the page language.
 */
import type { Organisation, Team } from '@realadvisor/sites-sdk/types';
import { lang, legalPath, privacyPath, t as kt } from '@realadvisor/sites-kit-core/i18n';
import { Wordmark } from './Wordmark';
import { href, LANGS, LOCALE, type L } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './Footer.css';

type Props = {
  l: L;
  org: Pick<Organisation, 'name' | 'logo'>;
  teams: Team[];
  areas: { slug: string; city: string }[];
  switchTo: Record<L, string>;
  hasDevelopments: boolean;
};

export function Footer({ l, org, teams, areas, switchTo, hasDevelopments }: Props) {
  const t = tx(l);
  const locale = LOCALE[l];
  const cities = joinList(teams.map((x) => cityName(x.address.city, l)).filter(Boolean), l);
  const explore = [
    { h: href('buy', l), label: t('navBuy') },
    { h: href('rent', l), label: t('navRent') },
    ...(hasDevelopments ? [{ h: href('developments', l), label: t('navNew') }] : []),
    { h: href('sold', l), label: t('navSold') },
    { h: href('sell', l), label: t('valuationCta') },
  ];
  const company = [
    { h: href('offices', l), label: t('navOffices') },
    { h: href('team', l), label: t('navTeam') },
    { h: href('about', l), label: t('navAbout') },
    { h: href('contact', l), label: t('navContact') },
  ];
  const year = new Date().getFullYear();
  return (
    <footer className="ft on-navy">
      <div className="wrap">
        <div className="ft__top">
          <div className="ft__brand">
            <Wordmark org={org} href={href('home', l)} tone="light" label={org.name} />
            {cities && <p>{t('footerLine', { cities })}</p>}
          </div>
          <div className="ft__offices">
            {teams.map((x) => (
              <address key={x.id}>
                <p className="ft__h">{cityName(x.address.city, l) || x.name}</p>
                {x.address.street && <span>{x.address.street}</span>}
                {(x.address.postcode || x.address.city) && <span>{[x.address.postcode, cityName(x.address.city, l)].filter(Boolean).join(' ')}</span>}
                {x.phone && <a className="num" href={tel(x.phone)}>{x.phone}</a>}
                {x.email && <a href={`mailto:${x.email}`}>{x.email}</a>}
              </address>
            ))}
          </div>
        </div>
        <div className="ft__links">
          <nav aria-label={t('explore')}>
            <p className="ft__h">{t('explore')}</p>
            <ul>{explore.map((x) => <li key={x.h}><a href={x.h}>{x.label}</a></li>)}</ul>
          </nav>
          {areas.length > 0 && (
            <nav aria-label={t('navAreas')}>
              <p className="ft__h"><a href={href('areas', l)}>{t('navAreas')}</a></p>
              <ul>{areas.map((a) => <li key={a.slug}><a href={href('areas', l, a.slug)}>{cityName(a.city, l)}</a></li>)}</ul>
            </nav>
          )}
          <nav aria-label={t('company')}>
            <p className="ft__h">{t('company')}</p>
            <ul>{company.map((x) => <li key={x.h}><a href={x.h}>{x.label}</a></li>)}</ul>
          </nav>
        </div>
        <div className="ft__legal">
          <p>© {year} {org.name}. {t('rights')}</p>
          <ul>
            <li><a href={legalPath(locale)}>{kt('legalNotice', {}, lang(locale))}</a></li>
            <li><a href={privacyPath(locale)}>{kt('privacyPolicy', {}, lang(locale))}</a></li>
            {LANGS.map((x) => <li key={x}><a href={switchTo[x]} hrefLang={x} lang={x} aria-current={x === l ? 'true' : undefined}>{x.toUpperCase()}</a></li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}
