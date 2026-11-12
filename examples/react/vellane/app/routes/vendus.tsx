/** Sold: what the agencies sold and let, same cards, no price. */
import type { Route } from './+types/vendus';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { ListingCard } from '../components/ListingCard';
import { siteData, sites } from '../lib/data.server';
import { R } from '../lib/site';
import './vendus.css';

export async function loader() {
  const [{ org }, sold] = await Promise.all([siteData(), sites.allListings({ status: 'sold' })]);
  return { brand: org.name.replace(/\s+SAS$/, ''), sold };
}

export default function Page({ loaderData: { brand, sold } }: Route.ComponentProps) {
  const n = sold.length;
  return (
    <Layout title={`Biens vendus | ${brand}`} description={`${n} biens vendus ou loués récemment par les agences ${brand}.`}>
      <PageHead title="Biens vendus" lede={n ? `${n} ${n > 1 ? 'biens vendus' : 'bien vendu'} récemment par nos agences. Le prix de vente reste confidentiel.` : undefined} />
      <div className="wrap">
        {n > 0 ? (
          <ul className="cards">{sold.map((l, i) => <li key={l.id}><ListingCard listing={l} priority={i === 0} as="h2" /></li>)}</ul>
        ) : (
          <p className="lede">Aucune vente à afficher pour le moment.</p>
        )}
        <p className="more"><a className="vb" href={R.sell}>Faire estimer mon bien</a></p>
      </div>
    </Layout>
  );
}
