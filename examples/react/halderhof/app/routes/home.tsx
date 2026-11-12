/**
 * Home: green hero with the search panel over the newest listing's photo;
 * newest listings; the three regions as full-width photo tiles; the
 * development as one large card with its prices and availability; the
 * valuation band; the affordability calculator. Every figure comes from
 * the data; a section without data is left out.
 */
import type { Route } from './+types/home';
import { img } from '@realadvisor/sites-kit/image';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { SearchPanel } from '../components/SearchPanel';
import { ListingCard } from '../components/ListingCard';
import { Affordability } from '../components/Affordability';
import { cardOf, siteData, sites, unitExtras } from '../lib/data.server';
import { regionsOf } from '../lib/regions';
import { groupLine, groups } from '../lib/dev';
import { placeOf } from '../content/places';
import { href, langOfPath, listingHref } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { monthYear, price } from '../lib/format';
import './home.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org, teams, primary }, raw, devs] = await Promise.all([siteData(), sites.allListings(), sites.developments()]);
  const all = raw.map(cardOf);
  const available = all.filter((x) => x.status === 'available');
  const buy = available.filter((x) => x.offer_type === 'buy');
  const rent = available.filter((x) => x.offer_type === 'rent');
  const hero = buy.find((x) => x.photos[0]) ?? available.find((x) => x.photos[0]);
  const fresh = buy.filter((x) => x.id !== hero?.id).slice(0, 4);
  const regions = regionsOf(teams, all)
    .filter((r) => r.available.length > 0)
    .map((r) => ({
      slug: r.slug,
      city: r.team.address.city,
      teamName: r.team.name,
      towns: r.towns.map((x) => x.city),
      nb: r.available.filter((x) => x.offer_type === 'buy').length,
      nr: r.available.filter((x) => x.offer_type === 'rent').length,
    }));
  const cities = joinList(teams.map((x) => cityName(x.address.city, l)).filter(Boolean), l);
  const d = devs[0] ? await sites.development(devs[0].slug) : null;
  const dev = d && {
    slug: d.slug, title: d.title, city: d.address.city, stats: d.stats, delivery_date: d.delivery_date, photo: d.photos[0],
    groups: groups(d.units, l, unitExtras(d.units)).map((g) => ({ key: g.key, label: g.label, line: groupLine(g, l) })),
  };
  const buyPrices = buy.map((x) => x.price ?? 0).filter((n) => n > 0).sort((a, b) => a - b);
  const median = buyPrices.length ? buyPrices[Math.floor(buyPrices.length / 2)]! : 0;
  const calcPrice = Math.round(median / 50_000) * 50_000;
  const agency = { id: org.id, name: org.name, phone: primary?.phone, email: primary?.email, address: org.address, website: org.website };
  const panel = (xs: typeof buy) => xs.map((x) => ({ price: x.price, property_type: x.property_type, address: { city: x.address.city } }));
  return {
    l, orgName: org.name, cities, hero, fresh, regions, dev, calcPrice,
    buyN: buy.length, rentN: rent.length, panelBuy: panel(buy), panelRent: panel(rent),
    jsonLd: agencyJsonLd(agency, new URL('/', siteUrl()).href),
  };
}

export default function Home({ loaderData: { l, orgName, cities, hero, fresh, regions, dev, calcPrice, buyN, rentN, panelBuy, panelRent, jsonLd } }: Route.ComponentProps) {
  const t = tx(l);
  return (
    <Site l={l} route="home"
      title={`${orgName} | ${t('homeTitle', { cities })}`}
      description={t('homeLede', { cities })}
      image={hero && img(hero.photos[0]!.url, { w: 1200, h: 630 })}
      jsonLd={jsonLd}>

      <section className="hero on-green">
        <div className="hero__grid">
          <div className="hero__panel">
            <h1 className="hero__title">{t('homeTitle', { cities })}</h1>
            <p className="hero__lede">{t('homeLede', { cities })}</p>
            <SearchPanel l={l} buy={panelBuy} rent={panelRent} />
          </div>
          {hero && (
            <figure className="hero__media" data-hero="">
              <Img src={hero.photos[0]} alt={hero.photos[0]!.alt || hero.title} width={1600} height={1100} priority
                sizes="(min-width: 1440px) 860px, (min-width: 1000px) 60vw, 100vw" mobile={{ width: 800, height: 600 }} />
              <figcaption><a href={listingHref(hero, l)}><span>{t('heroPhoto')}</span> {hero.title} · <span className="num">{price(hero, l)}</span></a></figcaption>
            </figure>
          )}
        </div>
      </section>

      {fresh.length > 0 && (
        <section className="section wrap" aria-labelledby="h-new">
          <div className="head">
            <h2 id="h-new" className="h2">{t('newTitle')}</h2>
            <a className="more" href={href('buy', l)}>{t('allBuyN', { n: buyN })}</a>
          </div>
          <ul className="plain-list row4">{fresh.map((x) => <li key={x.id}><ListingCard listing={x} l={l} sizes="(min-width: 1320px) 300px, (min-width: 1000px) 23vw, (min-width: 640px) 46vw, calc(100vw - 32px)" /></li>)}</ul>
          {rentN > 0 && <p className="rentline"><a className="more" href={href('rent', l)}>{t('allRentN', { n: rentN })}</a></p>}
        </section>
      )}

      {regions.length > 0 && (
        <section className="regions" aria-labelledby="h-regions">
          <h2 id="h-regions" className="sr-only">{t('regionsTitleN')}</h2>
          <ul className="plain-list regions__row">
            {regions.map((r) => {
              const city = cityName(r.city, l) || r.teamName;
              const place = placeOf(r.slug);
              return (
                <li key={r.slug}>
                  <a className="region" href={href('areas', l, r.slug)}>
                    {place && <Img src={place.photo} alt={place.alt[l]} width={900} height={1100} sizes="(min-width: 900px) 33vw, 100vw" mobile={{ width: 800, height: 560 }} />}
                    <span className="region__text">
                      <span className="region__name">{t('regionOf', { city })}</span>
                      <span className="region__meta">{r.towns.map((x) => cityName(x, l)).join(' · ')}</span>
                      <span className="region__count num">{r.nr ? t('regionCounts', { buy: r.nb, rent: r.nr }) : t('regionCountsBuy', { buy: r.nb })}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {dev && (
        <section className="section wrap" aria-labelledby="h-dev">
          <article className="dev">
            <a className="dev__media" href={href('developments', l, dev.slug)} tabIndex={-1} aria-hidden="true">
              {dev.photo && <Img src={dev.photo} alt="" width={1200} height={900} sizes="(min-width: 1000px) 56vw, 100vw" />}
            </a>
            <div className="dev__body">
              <p className="kicker">{t('devBandTitle', { city: cityName(dev.city, l) })}</p>
              <h2 id="h-dev" className="h2 dev__title"><a href={href('developments', l, dev.slug)}>{dev.title}</a></h2>
              <p className="dev__line">{t('devBandLine', { units: dev.stats.units, available: dev.stats.available, delivery: monthYear(dev.delivery_date, l) })}</p>
              <p className="dev__k">{t('priceAvail')}</p>
              <ul className="plain-list pa">
                {dev.groups.map((g) => (
                  <li key={g.key}><span className="pa__type">{g.label}</span><span className="pa__right"><span className="pa__price num">{g.line.price}</span><span className="pa__status">{g.line.status}</span></span></li>
                ))}
              </ul>
              <a className="button" href={href('developments', l, dev.slug)}>{t('toDevelopment')}</a>
            </div>
          </article>
        </section>
      )}

      <section className="valuation on-green" aria-labelledby="h-val">
        <div className="wrap valuation__in">
          <h2 id="h-val" className="h2">{t('valuationTitle')}</h2>
          <p className="valuation__text">{t('valuationText')}</p>
          <div className="valuation__actions">
            <a className="button button--light" href={href('sell', l)}>{t('valuationCta')}</a>
            <a className="more" href={href('sold', l)}>{t('navSold')}</a>
          </div>
        </div>
      </section>

      {calcPrice > 0 && (
        <div className="section wrap">
          <Affordability l={l} price={calcPrice} id="home-calc" />
        </div>
      )}
    </Site>
  );
}
