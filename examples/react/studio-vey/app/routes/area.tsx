import type { Route } from './+types/area';
import { ListingsMap } from '@realadvisor/sites-kit-react/components/ListingsMap';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit/image';
import { formatAmount } from '@realadvisor/sites-kit/format';
import { propertyTypeLabel } from '@realadvisor/sites-kit/i18n';
import { Layout } from '../components/Layout';
import { SoldList } from '../components/SoldList';
import { Collection } from '../components/Collection';
import { JournalCard } from '../components/JournalCard';
import { ValuationBand } from '../components/ValuationBand';
import { PlacePhoto } from '../components/PlacePhoto';
import { areas, brandName, site, sites } from '../lib/data.server';
import { posts, card } from '../content/journal.server';
import { listingUrl } from '../lib/urls';
import { price } from '../lib/format';
import { AREAS, defaultArea, placePhotoOg } from '../content/places';
import './orte-city.css';

export async function loader({ params }: Route.LoaderArgs) {
  const area = (await areas()).find((a) => a.slug === params.city);
  if (!area) throw notFound();
  const [s, all] = await Promise.all([site(), sites.allListings({ city: area.city })]);
  const copy = AREAS[area.slug] ?? defaultArea(area.city);
  return {
    brand: brandName(s),
    area,
    all,
    copy,
    og: new URL(placePhotoOg(copy.photo, img), siteUrl()).href,
    posts: posts().filter((p) => p.cities.includes(area.city)).slice(0, 3).map(card),
  };
}

export default function Area({ loaderData: { brand, area, all, copy, og, posts } }: Route.ComponentProps) {
  const buy = all.filter((l) => l.status === 'available' && l.offer_type === 'buy');
  const rent = all.filter((l) => l.status === 'available' && l.offer_type === 'rent');
  const sold = all.filter((l) => l.status === 'sold');
  const located = all.filter((l) => l.status === 'available' && l.address.lat != null && l.address.lng != null);
  // Figures from the data only.
  const prices = buy.map((l) => (l.price_on_request ? undefined : l.price)).filter((n): n is number => n != null);
  const types = [...new Set(buy.concat(rent).map((l) => propertyTypeLabel(l.property_type)))];
  const facts = [
    buy.length && { k: 'Zum Kauf', v: buy.length === 1 ? '1 Objekt' : `${buy.length} Objekte` },
    rent.length && { k: 'Zur Miete', v: rent.length === 1 ? '1 Objekt' : `${rent.length} Objekte` },
    prices.length > 1 && { k: 'Kaufpreise', v: `${formatAmount(Math.min(...prices))} bis ${formatAmount(Math.max(...prices))}` },
    prices.length === 1 && { k: 'Kaufpreis', v: formatAmount(prices[0]!) },
    types.length && { k: 'Objektarten', v: types.join(', ') },
    sold.length && { k: 'Verkauft', v: sold.length === 1 ? '1 Objekt' : `${sold.length} Objekte` },
  ].filter(Boolean) as { k: string; v: string }[];
  const q = encodeURIComponent(area.city);
  return (
    <Layout title={`Immobilien in ${area.city} | ${brand}`} description={`${copy.lede} Aktuelle Objekte von ${brand} in ${area.city}.`} image={og}>
      <section className="oh">
        <div className="oh-media"><PlacePhoto photo={copy.photo} width={1600} height={1100} priority sizes="(min-width: 1024px) 60vw, 100vw" mobile={{ width: 800, height: 600 }} /></div>
        <div className="oh-panel">
          <h1 className="h-display">{area.city}</h1>
          <p className="lede">{copy.lede}</p>
        </div>
      </section>

      <section className="wrap section ob flow">
        <div className="prose ob-prose">{copy.body.map((p, i) => <p key={i}>{p}</p>)}</div>
        {facts.length > 0 && (
          <dl className="ob-facts" aria-label={`${area.city} in Zahlen`}>
            {facts.map((f) => <div key={f.k}><dt className="caps muted">{f.k}</dt><dd className="num">{f.v}</dd></div>)}
          </dl>
        )}
      </section>

      <Collection id="c-buy" label="Zum Kauf" title={`Kaufen in ${area.city}`} listings={buy.slice(0, 6)} href={`/kaufen?city=${q}`} linkLabel={buy.length > 6 ? 'Alle ansehen' : 'Suchen und filtern'} />
      <Collection id="c-rent" label="Zur Miete" title={`Mieten in ${area.city}`} listings={rent.slice(0, 3)} href={`/mieten?city=${q}`} linkLabel="Alle ansehen" tone="tint" />

      {located.length > 0 && (
        <section className="wrap section-tight flow" aria-labelledby="h-map">
          <header className="sec"><h2 className="h2" id="h-map">Unsere Objekte in {area.city}</h2></header>
          <div className="om"><ListingsMap listings={located} href={listingUrl} price={price} /></div>
        </section>
      )}

      {sold.length > 0 && (
        <section className="wrap section-tight os" aria-labelledby="h-sold">
          <h2 className="h3" id="h-sold">Vermittelt in {area.city}</h2>
          <SoldList listings={sold.slice(0, 4)} />
        </section>
      )}

      {posts.length > 0 && (
        <section className="section journal" aria-labelledby="h-journal">
          <div className="wrap">
            <header className="sec"><h2 className="h2" id="h-journal">Über {area.city}</h2></header>
            <ul className="grid">{posts.map((p) => <li key={p.id}><JournalCard post={p} /></li>)}</ul>
          </div>
        </section>
      )}

      <ValuationBand sold={sold.length} where={`in ${area.city}`} />
    </Layout>
  );
}
