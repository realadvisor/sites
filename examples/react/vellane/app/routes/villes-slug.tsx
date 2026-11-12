/**
 * One city (3+ listings): a wide place photo with the name, the site's own
 * short text, figures computed from the listings, then its listings for sale
 * and to rent, with links into the split search for that city.
 */
import { Fragment } from 'react';
import type { Route } from './+types/villes-slug';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { img } from '@realadvisor/sites-kit/image';
import { RaImage } from '../components/RaImage';
import { Layout } from '../components/Layout';
import { ListingCard } from '../components/ListingCard';
import { Icon } from '../components/Icon';
import { siteData, sites } from '../lib/data.server';
import { citiesOf, formatAmount, R, searchUrl, teamHref, teamShortName } from '../lib/site';
import { placeFor } from '../content/places';
import { CITY_TEXT } from '../content/cities';
import './villes-slug.css';

export async function loader({ params }: Route.LoaderArgs) {
  const [{ org, teams }, all] = await Promise.all([siteData(), sites.allListings()]);
  const cities = citiesOf(all);
  const area = cities.find((c) => c.slug === params.slug);
  if (!area) throw notFound();
  const { city, slug, listings } = area;
  return {
    brand: org.name.replace(/\s+SAS$/, ''),
    city,
    slug,
    buy: listings.filter((l) => l.status === 'available' && l.offer_type === 'buy'),
    rent: listings.filter((l) => l.status === 'available' && l.offer_type === 'rent'),
    sold: listings.filter((l) => l.status === 'sold'),
    teamsHere: teams.filter((t) => listings.some((l) => l.team_ids.includes(t.id))),
    others: cities.filter((c) => c.slug !== slug).map((c) => ({ city: c.city, slug: c.slug })),
  };
}

export default function Page({ loaderData: { brand, city, slug, buy, rent, sold, teamsHere, others } }: Route.ComponentProps) {
  const photo = placeFor(slug)[0];
  const text = CITY_TEXT[slug];
  const prices = buy.flatMap((l) => (l.price && !l.price_on_request ? [l.price] : []));
  const range = prices.length > 1 ? `${formatAmount(Math.min(...prices))} à ${formatAmount(Math.max(...prices))}` : undefined;
  return (
    <Layout title={`Immobilier à ${city} : ${buy.length} à vendre, ${rent.length} à louer | ${brand}`}
      description={`${text?.lede ?? `Les annonces ${brand} à ${city}.`} ${buy.length} biens à vendre et ${rent.length} à louer.`}
      image={photo && img(photo.url, { w: 1200, h: 630 })}>
      <section className="hero">
        {photo && <RaImage className="hero__img" src={photo} alt={photo.alt ?? ''} width={1920} height={760} sizes="100vw" priority mobile={{ width: 800, height: 900 }} />}
        <div className="hero__in wrap">
          <a className="hero__back" href={R.cities}><Icon name="back" size={18} />Toutes les villes</a>
          <h1 className="hero__h1">Immobilier à {city}</h1>
        </div>
      </section>

      <section className="wrap intro">
        <div className="intro__text">
          {text && <p className="intro__lede">{text.lede}</p>}
          {text?.body.map((p, i) => <p key={i}>{p}</p>)}
          {teamsHere.length > 0 && <p className="muted">Agence{teamsHere.length > 1 ? 's' : ''} : {teamsHere.map((t, i) => <Fragment key={t.id}>{i > 0 && ', '}<a className="link" href={teamHref(t)}>{teamShortName(t)}</a></Fragment>)}</p>}
        </div>
        <dl className="figs">
          <div><dt>À vendre</dt><dd>{buy.length}</dd></div>
          <div><dt>À louer</dt><dd>{rent.length}</dd></div>
          {range && <div className="figs__wide"><dt>Prix des biens à vendre</dt><dd className="figs__range">{range}</dd></div>}
        </dl>
      </section>

      {buy.length > 0 && (
        <section className="wrap sec" aria-labelledby="b-h">
          <div className="section-head">
            <h2 id="b-h" className="h3">À vendre à {city}</h2>
            <a className="link" href={searchUrl('buy', { city })}>Sur la carte</a>
          </div>
          <ul className="cards">{buy.slice(0, 9).map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
          {buy.length > 9 && <p><a className="vb vb--ghost" href={searchUrl('buy', { city })}>Les {buy.length} biens à vendre</a></p>}
        </section>
      )}
      {rent.length > 0 && (
        <section className="wrap sec" aria-labelledby="r-h">
          <div className="section-head">
            <h2 id="r-h" className="h3">À louer à {city}</h2>
            <a className="link" href={searchUrl('rent', { city })}>Sur la carte</a>
          </div>
          <ul className="cards">{rent.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
        </section>
      )}
      {sold.length > 0 && (
        <section className="wrap sec" aria-labelledby="s-h">
          <h2 id="s-h" className="h3">Vendus récemment à {city}</h2>
          <ul className="cards">{sold.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
        </section>
      )}
      {others.length > 0 && (
        <nav className="wrap sec" aria-label="Autres villes">
          <p className="others">Autres villes : {others.map((c, i) => <Fragment key={c.slug}>{i > 0 && ' · '}<a className="link" href={`${R.cities}/${c.slug}`}>{c.city}</a></Fragment>)}</p>
        </nav>
      )}
    </Layout>
  );
}
