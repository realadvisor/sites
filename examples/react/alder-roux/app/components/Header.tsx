/**
 * Two-row header that scales to many offices: a thin utility row (one phone
 * per office, language switch) and the main bar (wordmark, sections,
 * valuation call to action). Phone: wordmark and a menu button that opens a
 * full-height sheet (native popover: Escape and outside click close it, no
 * JavaScript).
 */
import type { Organisation, Team } from '@realadvisor/sites-sdk/types';
import { Wordmark } from './Wordmark';
import { href, LANGS, type L, type RouteKey } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './Header.css';

type Props = {
  l: L;
  org: Pick<Organisation, 'name' | 'logo'>;
  teams: Team[];
  /** Section of the current page, for aria-current. */
  section?: RouteKey;
  /** The same page in each language. */
  switchTo: Record<L, string>;
  hasDevelopments: boolean;
};

export function Header({ l, org, teams, section, switchTo, hasDevelopments }: Props) {
  const t = tx(l);
  const nav: { key: RouteKey; label: string }[] = [
    { key: 'buy', label: t('navBuy') },
    { key: 'rent', label: t('navRent') },
    ...(hasDevelopments ? [{ key: 'developments' as const, label: t('navNew') }] : []),
    { key: 'sell', label: t('navSell') },
    { key: 'offices', label: t('navOffices') },
    { key: 'team', label: t('navTeam') },
    { key: 'about', label: t('navAbout') },
  ];
  const phones = teams.filter((x) => x.phone);
  const cur = (k: RouteKey) => (section === k ? ('page' as const) : undefined);
  return (
    <>
      <a className="skip" href="#main">{t('skip')}</a>
      <header className="hd">
        <div className="hd__util">
          <div className="wrap hd__util-in">
            <ul className="hd__phones" aria-label={t('phone')}>
              {phones.map((x) => (
                <li key={x.id}><span>{cityName(x.address.city, l) || x.name}</span> <a href={tel(x.phone!)} className="num">{x.phone}</a></li>
              ))}
            </ul>
            <nav className="hd__langs" aria-label={t('language')}>
              {LANGS.map((x) => (
                <a key={x} href={switchTo[x]} hrefLang={x} lang={x} aria-current={x === l ? 'true' : undefined}>{x.toUpperCase()}</a>
              ))}
            </nav>
          </div>
        </div>
        <div className="hd__bar">
          <div className="wrap hd__bar-in">
            <Wordmark org={org} href={href('home', l)} label={`${org.name}, ${t('home')}`} />
            <nav className="hd__nav" aria-label={t('mainNav')}>
              <ul>
                {nav.map((n) => (
                  <li key={n.key}><a href={href(n.key, l)} aria-current={cur(n.key)}>{n.label}</a></li>
                ))}
              </ul>
            </nav>
            <div className="hd__actions">
              <a className="hd__contact" href={href('contact', l)} aria-current={cur('contact')}>{t('navContact')}</a>
              <a className="button hd__cta" href={href('sell', l)}>{t('valuationCta')}</a>
              <button className="hd__burger" type="button" popoverTarget="hd-menu" aria-controls="hd-menu" aria-label={t('menu')}>
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
              </button>
            </div>
          </div>
        </div>
        <div id="hd-menu" className="sheet on-navy" popover="auto">
          <div className="sheet__top">
            <Wordmark org={org} href={href('home', l)} tone="light" label={`${org.name}, ${t('home')}`} />
            <button className="sheet__close" type="button" popoverTarget="hd-menu" popoverTargetAction="hide" aria-label={t('closeMenu')}>
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </div>
          <nav aria-label={t('mainNav')}>
            <ul className="sheet__nav">
              {nav.map((n) => <li key={n.key}><a href={href(n.key, l)} aria-current={cur(n.key)}>{n.label}</a></li>)}
              <li><a href={href('contact', l)}>{t('navContact')}</a></li>
            </ul>
          </nav>
          <ul className="sheet__phones">
            {phones.map((x) => <li key={x.id}><span>{cityName(x.address.city, l) || x.name}</span><a className="num" href={tel(x.phone!)}>{x.phone}</a></li>)}
          </ul>
          <div className="sheet__langs" aria-label={t('language')} role="group">
            {LANGS.map((x) => <a key={x} href={switchTo[x]} hrefLang={x} lang={x} aria-current={x === l ? 'true' : undefined}>{x === 'fr' ? 'Français' : 'Deutsch'}</a>)}
          </div>
        </div>
      </header>
    </>
  );
}
