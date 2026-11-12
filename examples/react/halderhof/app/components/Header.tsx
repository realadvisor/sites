/**
 * Green bar on every page: wordmark, sections, language switch (text codes)
 * and the valuation call to action. Phone: wordmark and a menu button that
 * opens a full-height sheet (native popover: Escape and outside click close
 * it, no JavaScript); a link click navigates away, which closes it.
 */
import { Wordmark } from './Wordmark';
import { href, LANGS, type L, type RouteKey } from '../lib/routes';
import { tx } from '../lib/copy';
import type { LayoutOrg } from './Site';
import './Header.css';

type Props = { l: L; org: LayoutOrg; section?: RouteKey; switchTo: Record<L, string>; hasDevelopments: boolean };
const LANG_FULL: Record<L, string> = { de: 'Deutsch', fr: 'Français', en: 'English' };

export function Header({ l, org, section, switchTo, hasDevelopments }: Props) {
  const t = tx(l);
  const nav: { key: RouteKey; label: string }[] = [
    { key: 'buy', label: t('navBuy') },
    { key: 'rent', label: t('navRent') },
    ...(hasDevelopments ? [{ key: 'developments' as const, label: t('navNew') }] : []),
    { key: 'sell', label: t('navSell') },
    { key: 'offices', label: t('navOffices') },
    { key: 'team', label: t('navTeam') },
    { key: 'contact', label: t('navContact') },
  ];
  const cur = (k: RouteKey) => (section === k ? 'page' : undefined);
  return (
    <>
      <a className="skip" href="#main">{t('skip')}</a>
      <header className="hd on-green">
        <div className="wrap hd__in">
          <Wordmark org={org} href={href('home', l)} label={`${org.name}, ${t('home')}`} />
          <nav className="hd__nav" aria-label={t('mainNav')}>
            <ul>
              {nav.map((n) => <li key={n.key}><a href={href(n.key, l)} aria-current={cur(n.key)}>{n.label}</a></li>)}
            </ul>
          </nav>
          <div className="hd__end">
            <nav className="hd__langs" aria-label={t('language')}>
              {LANGS.map((x) => <a key={x} href={switchTo[x]} hrefLang={x} lang={x} aria-current={x === l ? 'true' : undefined}>{x.toUpperCase()}</a>)}
            </nav>
            <a className="button button--light hd__cta" href={href('sell', l)}>{t('valuationCta')}</a>
            <button className="hd__burger" type="button" popoverTarget="hd-menu" aria-controls="hd-menu" aria-label={t('menu')}>
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
            </button>
          </div>
        </div>
        <div id="hd-menu" className="sheet on-green" popover="auto">
          <div className="sheet__top">
            <Wordmark org={org} href={href('home', l)} label={`${org.name}, ${t('home')}`} />
            <button className="sheet__close" type="button" popoverTarget="hd-menu" popoverTargetAction="hide" aria-label={t('closeMenu')}>
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </div>
          <nav aria-label={t('mainNav')}>
            <ul className="sheet__nav">
              {nav.map((n) => <li key={n.key}><a href={href(n.key, l)} aria-current={cur(n.key)}>{n.label}</a></li>)}
              <li><a href={href('about', l)} aria-current={cur('about')}>{t('navAbout')}</a></li>
            </ul>
          </nav>
          <a className="button button--light sheet__cta" href={href('sell', l)}>{t('valuationCta')}</a>
          <div className="sheet__langs" aria-label={t('language')} role="group">
            {LANGS.map((x) => <a key={x} href={switchTo[x]} hrefLang={x} lang={x} aria-current={x === l ? 'true' : undefined}>{LANG_FULL[x]}</a>)}
          </div>
        </div>
      </header>
    </>
  );
}
