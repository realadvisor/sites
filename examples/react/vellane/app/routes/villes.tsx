/** Cities: one tile per city with 3+ listings (photo, counts), a plain list of the rest. */
import type { Route } from './+types/villes';
import type { Listing } from '@realadvisor/sites-sdk/types';
import { RaImage } from '../components/RaImage';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { siteData, sites } from '../lib/data.server';
import { citiesOf, cityHref, searchUrl } from '../lib/site';
import { placeFor } from '../content/places';
import './villes.css';

const n = (ls: Listing[], offer: 'buy' | 'rent') => ls.filter((l) => l.status === 'available' && l.offer_type === offer).length;

export async function loader() {
  const [{ org }, all] = await Promise.all([siteData(), sites.allListings()]);
  const big = citiesOf(all);
  const bigNames = new Set(big.map((c) => c.city));
  const small = citiesOf(all, 1).filter((c) => !bigNames.has(c.city) && c.listings.some((l) => l.status === 'available'));
  return {
    brand: org.name.replace(/\s+SAS$/, ''),
    big: big.map((c) => ({ city: c.city, slug: c.slug, buy: n(c.listings, 'buy'), rent: n(c.listings, 'rent') })),
    small: small.map((c) => ({ city: c.city, offer: c.listings[0]!.offer_type, count: c.listings.length })),
  };
}

export default function Page({ loaderData: { brand, big, small } }: Route.ComponentProps) {
  return (
    <Layout title={`Nos villes | ${brand}`} description={`Acheter ou louer avec ${brand} : ${big.map((c) => c.city).join(', ')}.`}>
      <PageHead title="Nos villes" lede="Les villes où nous avons le plus de biens, avec ce que nous y vendons et louons." />
      <ul className="wrap tiles">
        {big.map((c, i) => {
          const p = placeFor(c.slug)[0];
          return (
            <li key={c.slug} className="tile">
              {p && <RaImage src={p} alt={p.alt ?? ''} width={800} height={560} sizes="(min-width: 960px) 420px, 100vw" priority={i === 0} />}
              <h2 className="tile__name"><a href={cityHref(c.city)}>{c.city}</a></h2>
              <p className="muted">{c.buy} à vendre · {c.rent} à louer</p>
            </li>
          );
        })}
      </ul>
      {small.length > 0 && (
        <div className="wrap small">
          <h2 className="h3">Aussi</h2>
          <ul>
            {small.map((c) => <li key={c.city}><a className="link" href={searchUrl(c.offer, { city: c.city })}>{c.city}</a> <span className="muted">{c.count} annonce{c.count > 1 ? 's' : ''}</span></li>)}
          </ul>
        </div>
      )}
    </Layout>
  );
}
