/**
 * Black footer: one column per office (address, phone, e-mail), the site's
 * sections, then the legal line with the legal notice and privacy policy in
 * the page language.
 */
import { legalPath, privacyPath, t as kt, lang as klang } from '@realadvisor/sites-kit-core/i18n';
import { href, LOCALE, teamSlug, type L } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import type { LayoutOrg, LayoutTeam } from './Site';
import './Footer.css';

type Props = { l: L; org: LayoutOrg; teams: LayoutTeam[] };

export function Footer({ l, org, teams }: Props) {
  const t = tx(l);
  const lg = klang(LOCALE[l]);
  const year = new Date().getFullYear();
  const props = [
    { label: t('navBuy'), href: href('buy', l) },
    { label: t('navRent'), href: href('rent', l) },
    { label: t('navSold'), href: href('sold', l) },
    { label: t('navDestinations'), href: href('destinations', l) },
    { label: t('valuation'), href: href('sell', l) },
  ];
  const company = [
    { label: t('navOffices'), href: href('offices', l) },
    { label: t('navTeam'), href: href('team', l) },
    { label: t('navJournal'), href: href('journal', l) },
    { label: t('navAbout'), href: href('about', l) },
    { label: t('navContact'), href: href('contact', l) },
  ];
  return (
    <footer className="ft on-ink">
      <div className="wrap ft__grid">
        <section className="ft__offices" aria-labelledby="ft-offices">
          <h2 id="ft-offices" className="sr-only">{t('footerOffices')}</h2>
          <ul className="plain">
            {teams.map((x) => (
              <li key={x.id}>
                <h3><a href={href('offices', l, teamSlug(x, teams))}>{cityName(x.address.city, l) || x.name}</a></h3>
                <address>
                  {x.address.street && <span>{x.address.street}</span>}
                  {(x.address.postcode || x.address.city) && <span>{[x.address.postcode, x.address.city].filter(Boolean).join(' ')}</span>}
                  {x.phone && <a className="num" href={tel(x.phone)}>{x.phone}</a>}
                  {x.email && <a href={`mailto:${x.email}`}>{x.email}</a>}
                </address>
              </li>
            ))}
          </ul>
        </section>
        <nav className="ft__nav" aria-labelledby="ft-props">
          <h2 id="ft-props" className="ft__h">{t('footerSite')}</h2>
          <ul className="plain">{props.map((x) => <li key={x.href}><a href={x.href}>{x.label}</a></li>)}</ul>
        </nav>
        <nav className="ft__nav" aria-labelledby="ft-company">
          <h2 id="ft-company" className="ft__h">{org.name}</h2>
          <ul className="plain">{company.map((x) => <li key={x.href}><a href={x.href}>{x.label}</a></li>)}</ul>
        </nav>
      </div>
      <div className="wrap ft__base">
        <p>{`© ${year} ${org.name}`}</p>
        <ul className="plain">
          <li><a href={legalPath(LOCALE[l])}>{kt('legalNotice', {}, lg)}</a></li>
          <li><a href={privacyPath(LOCALE[l])}>{kt('privacyPolicy', {}, lg)}</a></li>
        </ul>
      </div>
    </footer>
  );
}
