/**
 * Home: full-bleed hero photo of the highest-priced house for sale (static,
 * no carousel) with the offices' cities as the headline and live counts;
 * new listings; one tall tile per destination; one listing full-bleed; the
 * rentals as a plain list; selling on black with recent sales; the journal.
 */
import type { CSSProperties } from 'react';
import type { Route } from './+types/home';
import { img } from '@realadvisor/sites-kit/image';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { ListingCard } from '../components/ListingCard';
import { cardOf, siteData, sites } from '../lib/data.server';
import { href, langOfPath, listingHref, type L } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { dateLong, price } from '../lib/format';
import { destinations } from '../lib/regions';
import { placeOf } from '../content/places';
import { POSTS } from '../content/journal';
import './home.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org, teams }, raw] = await Promise.all([siteData(), sites.allListings()]);
  const all = raw.map(cardOf);
  const available = all.filter((x) => x.status === 'available');
  const forSale = available.filter((x) => x.offer_type === 'buy');
  const toRent = available.filter((x) => x.offer_type === 'rent');
  const sold = all.filter((x) => x.status === 'sold');
  const byPrice = [...forSale].filter((x) => x.photos.length && x.price && !x.price_on_request).sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  const hero = byPrice[0] ?? available.find((x) => x.photos.length);
  const dests = destinations(teams, all);
  // The full-bleed feature: the most expensive house of another office than the hero's.
  const feature = byPrice.find((x) => hero && !x.team_ids.some((id) => hero.team_ids.includes(id)) && x.photos.length);
  // Newest first, taken in turn from each office so one destination does not fill the grid.
  const pool = forSale.filter((x) => x.id !== hero?.id && x.id !== feature?.id);
  const queues = teams.map((tm) => pool.filter((x) => x.team_ids.includes(tm.id)));
  const latest: typeof pool = [];
  for (let i = 0; latest.length < 6 && queues.some((q) => q.length > i); i++) for (const q of queues) if (q[i] && latest.length < 6) latest.push(q[i]!);
  return {
    l,
    orgName: org.name,
    jsonLd: agencyJsonLd({ id: org.id, name: org.name, phone: teams[0]?.phone, email: teams[0]?.email, address: org.address }, new URL('/', siteUrl()).href),
    cities: joinList(teams.map((x) => cityName(x.address.city, l)).filter(Boolean), l),
    nSale: forSale.length,
    nRent: toRent.length,
    nOffices: teams.length,
    hero,
    feature,
    latest,
    dests: dests.map((d) => {
      const p = placeOf(d.slug);
      const photo = p?.photos[0] ? { url: p.photos[0].url, alt: p.photos[0].alt[l] } : d.available[0]?.photos[0];
      return { slug: d.slug, name: cityName(d.team.address.city, l) || d.team.name, count: d.available.length, photo };
    }),
    rent: toRent.slice(0, 4),
    sold: sold.slice(0, 4).map((x) => ({ id: x.id, slug: x.slug, title: x.title, city: x.address.city })),
  };
}

const COPY = (l: L, cities: string) =>
  ({
    en: {
      title: `Houses and apartments in ${cities}`,
      forSale: (n: number) => `${n} for sale`,
      toRent: (n: number) => `${n} to rent`,
      offices: (n: number) => `${n} ${n === 1 ? 'office' : 'offices'}`,
      seeSale: 'Properties for sale',
      newest: 'New to the market',
      allSale: (n: number) => `All ${n} properties for sale`,
      dest: 'Destinations',
      props: (n: number) => `${n} ${n === 1 ? 'property' : 'properties'}`,
      viewHouse: 'View the property',
      rent: 'To rent',
      rentLede: 'Furnished seasonal lets in Gstaad and on the peninsula, and apartments in Geneva on long leases. Prices are per month.',
      allRent: 'All rentals',
      sellTitle: `Selling a house in ${cities}`,
      sellText: 'An agent from the office nearest to your house visits it, tells you what it would sell for and how we would market it. There is no charge for the valuation.',
      recent: 'Recently sold',
      journal: 'Journal',
      allPosts: 'All articles',
    },
    fr: {
      title: `Maisons et appartements à ${cities}`,
      forSale: (n: number) => `${n} à vendre`,
      toRent: (n: number) => `${n} à louer`,
      offices: (n: number) => `${n} ${n === 1 ? 'bureau' : 'bureaux'}`,
      seeSale: 'Biens à vendre',
      newest: 'Nouveaux sur le marché',
      allSale: (n: number) => `Les ${n} biens à vendre`,
      dest: 'Destinations',
      props: (n: number) => `${n} ${n === 1 ? 'bien' : 'biens'}`,
      viewHouse: 'Voir le bien',
      rent: 'À louer',
      rentLede: 'Locations saisonnières meublées à Gstaad et sur la presqu’île, appartements à Genève en bail longue durée. Loyers mensuels.',
      allRent: 'Toutes les locations',
      sellTitle: `Vendre une maison à ${cities}`,
      sellText: 'Un agent du bureau le plus proche visite votre maison, vous dit à quel prix elle se vendrait et comment nous la présenterions. L’estimation est gratuite.',
      recent: 'Vendus récemment',
      journal: 'Journal',
      allPosts: 'Tous les articles',
    },
  })[l];

export default function Home({ loaderData: d }: Route.ComponentProps) {
  const { l, hero, feature } = d;
  const t = tx(l);
  const C = COPY(l, d.cities);
  const heroPhoto = hero?.photos[0];
  const figures = [d.nSale ? C.forSale(d.nSale) : '', d.nRent ? C.toRent(d.nRent) : '', C.offices(d.nOffices)].filter(Boolean);
  return (
    <Site l={l} route="home" overlay title={`${d.orgName} | ${C.title}`} description={`${d.orgName}: ${figures.join(', ')}. ${C.title}.`}
      image={heroPhoto && img(heroPhoto.url, { w: 1200, h: 630 })} jsonLd={d.jsonLd}>
      <section className="hero on-ink" data-hero="">
        {heroPhoto && (
          <Img src={heroPhoto} alt={heroPhoto.alt || hero!.title} width={1600} height={900} priority sizes="100vw"
            mobile={{ width: 800, height: 1100 }} className="hero__img" />
        )}
        <div className="hero__scrim" aria-hidden="true"></div>
        <div className="wrap hero__in">
          <div className="hero__text">
            <h1 className="hero__title">{C.title}</h1>
            <p className="hero__figures label">{figures.join(' · ')}</p>
            <div className="hero__ctas">
              {d.nSale > 0 && <a className="cta cta--light" href={href('buy', l)}>{C.seeSale}</a>}
              <a className="cta cta--outline-light" href={href('sell', l)}>{t('valuation')}</a>
            </div>
          </div>
          {hero && (
            <a className="hero__cap" href={listingHref(hero, l)}>
              <span>{hero.title}</span>
              <span className="num">{price(hero, l)}</span>
            </a>
          )}
        </div>
      </section>

      {d.latest.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="head">
              <h2 className="h2">{C.newest}</h2>
              <a className="link" href={href('buy', l)}>{C.allSale(d.nSale)}</a>
            </div>
            <ul className="plain grid3">
              {d.latest.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}
            </ul>
          </div>
        </section>
      )}

      {d.dests.length > 1 && (
        <section className="dests section--tight" aria-labelledby="dest-h">
          <div className="wrap">
            <h2 id="dest-h" className="h2 dests__h">{C.dest}</h2>
            <ul className="plain dests__grid" style={{ '--n': d.dests.length } as CSSProperties}>
              {d.dests.map((x) => (
                <li key={x.slug}>
                  <a className="dest" href={href('destinations', l, x.slug)}>
                    {x.photo && <Img src={x.photo} alt={x.photo.alt ?? ''} width={640} height={860} sizes="(min-width: 1024px) 31vw, (min-width: 640px) 50vw, 100vw" />}
                    <span className="dest__text">
                      <span className="dest__name">{x.name}</span>
                      <span className="dest__count">{C.props(x.count)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {feature && (
        <section className="feature on-ink">
          <Img src={feature.photos[0]} alt={feature.photos[0]!.alt || feature.title} width={1600} height={800} sizes="100vw" mobile={{ width: 800, height: 1000 }} className="feature__img" />
          <div className="feature__scrim" aria-hidden="true"></div>
          <div className="wrap feature__in">
            <p className="feature__place">{cityName(feature.address.city, l)}</p>
            <h2 className="feature__title">{feature.title}</h2>
            <p className="feature__price num">{price(feature, l)}</p>
            <a className="cta cta--light" href={listingHref(feature, l)}>{C.viewHouse}</a>
          </div>
        </section>
      )}

      {d.rent.length > 0 && (
        <section className="section rent">
          <div className="wrap rent__grid">
            <div>
              <h2 className="h2">{C.rent}</h2>
              <p className="lede">{C.rentLede}</p>
              <a className="link rent__all" href={href('rent', l)}>{C.allRent}</a>
            </div>
            <ul className="plain rent__list">
              {d.rent.map((x) => (
                <li key={x.id}>
                  <a href={listingHref(x, l)} className="row">
                    {x.photos[0] && <Img src={x.photos[0]} alt="" width={300} height={225} sizes="150px" widths={[300, 450]} className="row__img" />}
                    <span className="row__text">
                      <span className="row__place">{cityName(x.address.city, l)}</span>
                      <span className="row__title">{x.title}</span>
                    </span>
                    <span className="row__price num">{price(x, l)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="sell on-ink section">
        <div className="wrap sell__grid">
          <div className="sell__text">
            <h2 className="h2">{C.sellTitle}</h2>
            <p className="lede">{C.sellText}</p>
            <a className="cta cta--gold" href={href('sell', l)}>{t('valuation')}</a>
          </div>
          {d.sold.length > 0 && (
            <div className="sell__sold">
              <h3 className="sell__h label">{C.recent}</h3>
              <ul className="plain">
                {d.sold.map((x) => (
                  <li key={x.id}><a href={listingHref(x, l)}><span>{x.title}</span><span className="muted-ink">{cityName(x.city, l)}</span></a></li>
                ))}
              </ul>
              <a className="link" href={href('sold', l)}>{t('navSold')}</a>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="head">
            <h2 className="h2">{C.journal}</h2>
            <a className="link" href={href('journal', l)}>{C.allPosts}</a>
          </div>
          <ul className="plain posts">
            {POSTS.map((p) => (
              <li key={p.slug}>
                <a className="post" href={href('journal', l, p.slug)}>
                  <Img src={p.cover.url} alt={p.cover.alt[l]} width={720} height={480} sizes="(min-width: 1024px) 30vw, 100vw" />
                  <time dateTime={p.date} className="post__date">{dateLong(p.date, l)}</time>
                  <h3 className="post__title">{p.title[l]}</h3>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Site>
  );
}
