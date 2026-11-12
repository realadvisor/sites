import type { Route } from './+types/home';
import { agencyOf } from '@realadvisor/sites-kit-core/agency';
import type { Listing } from '@realadvisor/sites-sdk/types';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { img } from '@realadvisor/sites-kit-core/image';
import { agencyJsonLd } from '@realadvisor/sites-kit-core/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Layout } from '../components/Layout';
import { OfferTabs } from '../components/OfferTabs';
import { SoldList } from '../components/SoldList';
import { TalkBand } from '../components/TalkBand';
import { PlacePhoto } from '../components/PlacePhoto';
import { areas, brandName, site, sites } from '../lib/data.server';
import { posts, card } from '../content/journal.server';
import { areaUrl, listingUrl } from '../lib/urls';
import { facts, formatDate, kind, price } from '../lib/format';
import { AREAS, defaultArea } from '../content/places';
import './index.css';

/** A listing as a card shows it: no description, no agent (loader data stays small). */
const cardOf = ({ description: _d, description_text: _t, agent: _a, ...l }: Listing): Listing => l;

export async function loader() {
  const s = await site();
  const [buy, rent, sold, places] = await Promise.all([
    sites.listings({ offer_type: 'buy', status: 'available', limit: 24 }),
    sites.listings({ offer_type: 'rent', status: 'available', limit: 4 }),
    sites.listings({ status: 'sold', limit: 4 }),
    areas(),
  ]);
  // Hero: the newest listing for sale with a photo (else for rent).
  const hero = buy.data.find((l) => l.photos[0]) ?? rent.data.find((l) => l.photos[0]);
  const shown = new Set(hero ? [hero.id] : []);
  const take = (list: Listing[], n: number) => {
    const out = list.filter((l) => !shown.has(l.id)).slice(0, n);
    out.forEach((l) => shown.add(l.id));
    return out.map(cardOf);
  };
  return {
    s,
    brand: brandName(s),
    hero: hero && cardOf(hero),
    fresh: take(buy.data, 3),
    toRent: take(rent.data, 3),
    buyTotal: buy.pagination.total,
    rentTotal: rent.pagination.total,
    sold: sold.data.map(cardOf),
    places: places.map((p) => ({ ...p, copy: AREAS[p.slug] ?? defaultArea(p.city) })),
    journal: posts().slice(0, 3).map(card),
    jsonLd: agencyJsonLd(agencyOf(s.org, s.team), new URL('/', siteUrl()).href),
  };
}

const objects = (n: number) => (n === 1 ? '1 Objekt' : `${n} Objekte`);

export default function Home({ loaderData: d }: Route.ComponentProps) {
  const { s, brand, hero } = d;
  return (
    <Layout
      title={`${brand} · Immobilien in Zürich, am See und in Zug`}
      description={s.team.description_text ?? `${brand}: Immobilien kaufen, verkaufen und mieten in Zürich.`}
      image={hero?.photos[0] && img(hero.photos[0].url, { w: 1200, h: 630 })}
      jsonLd={d.jsonLd}
    >
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media">
          {hero?.photos[0] && (
            <a href={listingUrl(hero)} tabIndex={-1} aria-hidden="true">
              <RaImage src={hero.photos[0]} alt="" width={1600} height={1200} priority sizes="(min-width: 1024px) 60vw, 100vw" mobile={{ width: 800, height: 640 }} />
            </a>
          )}
        </div>
        <div className="hero-panel">
          <div className="hero-text">
            <p className="eyebrow">{brand} · {s.team.address.city}</p>
            <h1 className="h-display" id="hero-title">Häuser und Wohnungen am See, in der Stadt und in Zug.</h1>
            <ul className="hero-links">
              {d.buyTotal > 0 && <li><a href="/kaufen"><span>Kaufen</span><span className="num muted">{objects(d.buyTotal)}</span></a></li>}
              {d.rentTotal > 0 && <li><a href="/mieten"><span>Mieten</span><span className="num muted">{objects(d.rentTotal)}</span></a></li>}
              <li><a href="/verkaufen"><span>Verkaufen</span><span className="muted">Bewertung</span></a></li>
            </ul>
          </div>
          {hero && (
            <a className="hero-caption" href={listingUrl(hero)}>
              <span className="caps muted">Im Bild · {kind(hero)}</span>
              <span className="hero-caption-title">{hero.title}</span>
              <span className="num">{price(hero)}{facts(hero) && <span className="muted"> · {facts(hero)}</span>}</span>
            </a>
          )}
        </div>
      </section>

      <OfferTabs
        title="Aktuelle Objekte"
        panels={[
            { key: 'kaufen', label: 'Kaufen', heading: 'Zum Kauf', total: d.buyTotal, listings: d.fresh, href: '/kaufen', linkLabel: `Alle ${objects(d.buyTotal)} zum Kauf` },
            { key: 'mieten', label: 'Mieten', heading: 'Zur Miete', total: d.rentTotal, listings: d.toRent, href: '/mieten', linkLabel: `Alle ${objects(d.rentTotal)} zur Miete` },
        ]}
      />

      <section className="sell section" aria-labelledby="sell-title">
        <div className="wrap sell-in">
          <div className="sell-text">
            <h2 className="h2" id="sell-title">Was ist Ihre Immobilie wert?</h2>
            <p className="muted">Wir besichtigen Ihr Haus oder Ihre Wohnung und begründen die Einschätzung mit vergleichbaren Verkäufen. Die Bewertung ist kostenlos und unverbindlich.</p>
            <p className="sell-actions"><a className="button button--solid" href="/verkaufen#bewertung">Bewertung anfragen</a></p>
          </div>
          {d.sold.length > 0 && (
            <div className="sell-sold">
              <h3 className="sell-h"><span>Zuletzt vermittelt</span><a className="more" href="/verkauft">Alle</a></h3>
              <SoldList listings={d.sold} />
            </div>
          )}
        </div>
      </section>

      {d.places.length > 0 && (
        <section className="places section" aria-labelledby="places-title">
          <div className="wrap">
            <header className="sec-head"><h2 className="h2" id="places-title">Orte</h2></header>
            <ul className="places-grid">
              {d.places.map((p) => (
                <li key={p.slug}>
                  <a className="place" href={areaUrl(p.city)}>
                    <div className="place-media"><PlacePhoto photo={p.copy.photo} width={1200} height={800} sizes="(min-width: 768px) 46vw, 100vw" /></div>
                    <span className="place-name">{p.city}</span>
                    <span className="caps muted">{objects(p.total)} aktuell und vermittelt</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {d.journal.length > 0 && (
        <section className="journal wrap section" aria-labelledby="journal-title">
          <div className="journal-side">
            <h2 className="h2" id="journal-title">Journal</h2>
            <a className="more" href="/journal">Alle Beiträge</a>
          </div>
          <ul className="journal-list">
            {d.journal.map((p) => (
              <li key={p.id}>
                <a href={`/journal/${p.id}`}>
                  <span className="journal-meta muted"><time dateTime={p.date}>{formatDate(p.date)}</time> · {p.author}</span>
                  <span className="journal-title">{p.title}</span>
                  <span className="journal-excerpt muted">{p.excerpt}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <TalkBand title="Kontakt" text={`Unser Büro ist an der ${[s.team.address.street, s.team.address.city].filter(Boolean).join(' in ')}. Für eine Bewertung kommen wir zu Ihnen.`} phone={s.team.phone} email={s.team.email} action={{ href: '/kontakt', label: 'Termin vereinbaren' }} />
    </Layout>
  );
}
