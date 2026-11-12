/**
 * Two-row header: wordmark and utilities (sell, contact, language) on the
 * first row, the property sections on a hairline row below, as on the
 * luxury marketplaces. `overlay` lays it over the home hero in ivory type
 * (the hero carries a scrim). Phone: wordmark and a 44px menu button that
 * opens a full-screen sheet (native popover: Escape closes it; menu() in
 * app/client.ts closes it on link click and keeps aria-expanded in step).
 */
import { href, LANGS, type L, type RouteKey } from '../lib/routes';
import { tx } from '../lib/copy';
import type { LayoutOrg } from './Site';
import './Header.css';

type Props = { l: L; org: LayoutOrg; section?: RouteKey; switchTo: Record<L, string>; overlay?: boolean };

export function Header({ l, org, section, switchTo, overlay = false }: Props) {
  const t = tx(l);
  const nav: { key: RouteKey; label: string }[] = [
    { key: 'buy', label: t('navBuy') },
    { key: 'rent', label: t('navRent') },
    { key: 'sold', label: t('navSold') },
    { key: 'destinations', label: t('navDestinations') },
    { key: 'offices', label: t('navOffices') },
    { key: 'team', label: t('navTeam') },
    { key: 'journal', label: t('navJournal') },
    { key: 'about', label: t('navAbout') },
  ];
  const name = org.name.replace(/\s+(SA|AG|Sàrl|GmbH|SAS|SARL|Ltd)\.?$/i, '');
  const [first, ...rest] = name.split(' ');
  const cur = (k: RouteKey) => (section === k ? 'page' : undefined);
  const mark = (
    <a className="mark" href={href('home', l)} aria-label={`${org.name}, ${t('home')}`}>
      <span className="mark__name">{first}</span>{rest.length > 0 && <span className="mark__rest">{rest.join(' ')}</span>}
    </a>
  );
  return (
    <>
      <a className="skip" href="#main">{t('skip')}</a>
      <header className={overlay ? 'hd hd--overlay' : 'hd'}>
        <div className="wrap hd__top">
          {mark}
          <div className="hd__utils">
            <a className="hd__util" href={href('sell', l)} aria-current={cur('sell')}>{t('navSell')}</a>
            <a className="hd__util" href={href('contact', l)} aria-current={cur('contact')}>{t('navContact')}</a>
            <nav className="hd__langs" aria-label={t('language')}>
              {LANGS.map((x) => <a key={x} href={switchTo[x]} hrefLang={x} lang={x} aria-current={x === l ? 'true' : undefined}>{x.toUpperCase()}</a>)}
            </nav>
            <button className="hd__burger" type="button" popoverTarget="menu" aria-controls="menu" aria-label={t('menu')}>
              <svg aria-hidden="true" width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 8h20M3 13h20M3 18h20" /></svg>
            </button>
          </div>
        </div>
        <nav className="hd__nav" aria-label={t('mainNav')}>
          <ul className="wrap plain">
            {nav.map((n) => <li key={n.key}><a href={href(n.key, l)} aria-current={cur(n.key)}>{n.label}</a></li>)}
          </ul>
        </nav>
        <div id="menu" className="sheet on-ink" popover="auto" data-menu="">
          <div className="sheet__top">
            {mark}
            <button className="sheet__close" type="button" popoverTarget="menu" popoverTargetAction="hide" aria-label={t('closeMenu')}>
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </div>
          <nav aria-label={t('mainNav')}>
            <ul className="sheet__nav plain">
              {nav.map((n) => <li key={n.key}><a href={href(n.key, l)} aria-current={cur(n.key)}>{n.label}</a></li>)}
              <li><a href={href('sell', l)} aria-current={cur('sell')}>{t('navSell')}</a></li>
              <li><a href={href('contact', l)} aria-current={cur('contact')}>{t('navContact')}</a></li>
            </ul>
          </nav>
          <div className="sheet__langs" role="group" aria-label={t('language')}>
            {LANGS.map((x) => <a key={x} href={switchTo[x]} hrefLang={x} lang={x} aria-current={x === l ? 'true' : undefined}>{x === 'en' ? 'English' : 'Français'}</a>)}
          </div>
        </div>
      </header>
    </>
  );
}
