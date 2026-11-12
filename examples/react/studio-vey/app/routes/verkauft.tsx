import type { Route } from './+types/verkauft';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { ListingCard } from '../components/ListingCard';
import { ValuationBand } from '../components/ValuationBand';
import { brandName, site, sites } from '../lib/data.server';
import './verkauft.css';

export async function loader() {
  const [s, sold] = await Promise.all([site(), sites.allListings({ status: 'sold' })]);
  return { brand: brandName(s), sold };
}

export default function Sold({ loaderData: { brand, sold } }: Route.ComponentProps) {
  const photo = sold.find((l) => l.photos[0])?.photos[0];
  const cities = [...new Set(sold.map((l) => l.address.city).filter(Boolean))] as string[];
  const n = sold.length;
  return (
    <Layout title={`Verkaufte Objekte | ${brand}`} description={`${n} von ${brand} vermittelte Objekte${cities.length ? ` in ${cities.join(', ')}` : ''}.`} image={photo && img(photo.url, { w: 1200, h: 630 })}>
      <PageHead title="Zuletzt vermittelt" lede={n ? `${n === 1 ? 'Ein Objekt' : `${n} Objekte`}${cities.length ? ` in ${cities.join(', ')}` : ''}, die neue Eigentümerinnen und Eigentümer gefunden haben.` : undefined} />
      <section className="wrap sold" aria-label="Verkaufte Objekte">
        {n > 0 ? (
          <ul className="sold-grid">{sold.map((l, i) => <li key={l.id}><ListingCard listing={l} priority={i === 0} as="h2" /></li>)}</ul>
        ) : (
          <p className="lede muted">Sobald wir Objekte vermittelt haben, zeigen wir sie hier.</p>
        )}
      </section>
      <ValuationBand sold={n} />
    </Layout>
  );
}
