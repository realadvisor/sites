/**
 * Home: search first. The pill opens the split results view; right under it
 * the newest listings, then the two cities as two big photo cards, rentals
 * as one scrolling row, the agencies as a plain list and the valuation offer.
 */
import type { Route } from './+types/home';
import { RaImage } from '../components/RaImage';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { agencyJsonLd } from '@realadvisor/sites-kit-core/seo';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { SearchPill, searchPillForms } from '../components/SearchPill';
import { ListingCard } from '../components/ListingCard';
import { Icon } from '../components/Icon';
import { agency, siteData, sites } from '../lib/data.server';
import { citySlug, cityHref, joinFr, R, searchUrl, teamHref, teamShortName, tel } from '../lib/site';
import { placeFor } from '../content/places';
import './home.css';

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

export async function loader() {
  const [{ org, teams }, all, ag] = await Promise.all([siteData(), sites.allListings(), agency()]);
  const live = all.filter((l) => l.status === 'available');
  const buy = live.filter((l) => l.offer_type === 'buy');
  const rent = live.filter((l) => l.offer_type === 'rent');
  const offer: 'buy' | 'rent' = buy.length ? 'buy' : 'rent';
  const newest = (buy.length ? buy : live).slice(0, 8);
  const byCity = new Map<string, number>();
  for (const l of live) if (l.address.city) byCity.set(l.address.city, (byCity.get(l.address.city) ?? 0) + 1);
  const ranked = [...byCity].sort((a, b) => b[1] - a[1]);
  // The two cities with most listings, each with its own photo.
  const cities = ranked
    .map(([city, n]) => ({ city, n, photo: placeFor(citySlug(city))[0] }))
    .filter((c) => c.photo)
    .slice(0, 2);
  const teamCities = [...new Set(teams.map((t) => t.address.city).filter(Boolean))] as string[];
  const countBy = (teamId: string) => live.filter((l) => l.team_ids.includes(teamId)).length;
  return {
    orgName: org.name,
    teams: teams.map((t) => ({ ...t, n: countBy(t.id) })),
    teamCities,
    forms: searchPillForms(all),
    offer,
    nLive: live.length,
    nBuy: buy.length,
    nRent: rent.length,
    quick: ranked.slice(0, 5).map(([c]) => c),
    nRanked: ranked.length,
    newest,
    cities,
    rent: rent.slice(0, 10),
    jsonLd: agencyJsonLd(ag, new URL(siteUrl()).origin),
  };
}

export default function Home({ loaderData: d }: Route.ComponentProps) {
  const brand = d.orgName.replace(/\s+(SAS|SA|SARL)$/, '');
  const title = `${brand} · Achat, location et estimation à ${joinFr(d.teamCities)}`;
  const description = `${plural(d.nBuy, 'bien', 'biens')} à vendre et ${plural(d.nRent, 'bien', 'biens')} à louer à ${joinFr(d.teamCities)} et alentour, dans nos ${d.teams.length} agences.`;
  const ogPhoto = d.newest[0]?.photos[0];
  return (
    <Layout title={title} description={description} jsonLd={d.jsonLd} image={ogPhoto && img(ogPhoto.url, { w: 1200, h: 630 })}>
      <section className="hero">
        <div className="wrap hero__in">
          <h1 className="hero__title">Trouvez votre logement à {joinFr(d.teamCities)}</h1>
          <p className="hero__lede">{plural(d.nLive, 'bien', 'biens')} à vendre et à louer dans nos {d.teams.length} agences.</p>
          <SearchPill forms={d.forms} />
          {d.nRanked > 1 && (
            <p className="hero__quick">
              <span>Accès direct</span>
              {d.quick.map((c) => <a key={c} href={searchUrl(d.offer, { city: c })}>{c}</a>)}
            </p>
          )}
        </div>
      </section>

      {d.newest.length > 0 && (
        <section className="wrap block" aria-labelledby="new-h">
          <div className="section-head">
            <h2 id="new-h" className="h3">{d.offer === 'buy' ? 'Dernières annonces à vendre' : 'Dernières annonces'}</h2>
            <a className="link" href={searchUrl(d.offer)}>Les {d.offer === 'buy' ? d.nBuy : d.nLive} annonces sur la carte</a>
          </div>
          <ul className="cards cards--4">
            {d.newest.map((l, i) => <li key={l.id}><ListingCard listing={l} priority={i === 0} sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 100vw" /></li>)}
          </ul>
        </section>
      )}

      {d.cities.length > 0 && (
        <section className="wrap block cities" aria-label="Nos villes">
          {d.cities.map((c) => (
            <a key={c.city} className="city" href={cityHref(c.city)}>
              <RaImage src={c.photo} alt={c.photo!.alt ?? ''} width={1200} height={800} sizes="(min-width: 960px) 640px, 100vw" mobile={{ width: 800, height: 900 }} />
              <span className="city__text">
                <span className="city__name">{c.city}</span>
                <span className="city__n">{plural(c.n, 'annonce en cours', 'annonces en cours')}</span>
              </span>
            </a>
          ))}
        </section>
      )}

      {d.nRent > 0 && (
        <section className="block" aria-labelledby="rent-h">
          <div className="wrap section-head">
            <h2 id="rent-h" className="h3">À louer en ce moment</h2>
            <a className="link" href={searchUrl('rent')}>Les {d.nRent} locations</a>
          </div>
          <div className="wrap">
            <ul className="row" tabIndex={0} aria-label="Locations (faire défiler)">
              {d.rent.map((l) => <li key={l.id}><ListingCard listing={l} sizes="300px" /></li>)}
            </ul>
          </div>
        </section>
      )}

      <section className="wrap block" aria-labelledby="ag-h">
        <h2 id="ag-h" className="h3">Nos {d.teams.length} agences</h2>
        <ul className="agl">
          {d.teams.map((t) => (
            <li key={t.id} className="agl__row">
              <a className="agl__name" href={teamHref(t)}>{teamShortName(t)}<span className="agl__city">{t.address.city}</span></a>
              <span className="agl__addr">{[t.address.street, [t.address.postcode, t.address.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</span>
              {t.phone && <a className="agl__tel num" href={tel(t.phone)}><Icon name="phone" size={16} />{t.phone}</a>}
              <a className="agl__n" href={teamHref(t)}>{plural(t.n, 'annonce', 'annonces')}<Icon name="arrow" size={16} /></a>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap block" aria-labelledby="sell-h">
        <div className="sell">
          <h2 id="sell-h" className="h3">Vous vendez à {joinFr(d.teamCities, 'ou à')} ?</h2>
          <p>Un agent de l'agence la plus proche visite le bien, puis vous remet par écrit une estimation avec les ventes comparables du quartier. C'est gratuit et sans engagement.</p>
          <div className="sell__actions">
            <a className="vb" href={R.sell}>Demander une estimation</a>
            <a className="vb vb--ghost" href={R.sold}>Nos biens vendus</a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
