/** Sold: past sales in the same grid, "Vendu" on the photo, no prices; valuation call to action. */
import type { Route } from './+types/sold';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { ListingCard } from '../components/ListingCard';
import { ValuationBand } from '../components/ValuationBand';
import { sites } from '../lib/data.server';
import { href, langOf } from '../lib/routes';
import { tx } from '../lib/copy';
import './sold.css';

export async function loader({ request }: Route.LoaderArgs) {
  const [org, sold] = await Promise.all([sites.organisation(), sites.allListings({ status: 'sold' })]);
  return { l: langOf(new URL(request.url).pathname), name: org.name, sold };
}

export default function Page({ loaderData: { l, name, sold } }: Route.ComponentProps) {
  const t = tx(l);
  return (
    <Layout l={l} route="sold" title={`${t('soldTitle')} | ${name}`} description={t('soldLede')}>
      <section className="band on-navy">
        <div className="wrap band__inner">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navSold') }]} />
          <h1 className="h1">{t('soldTitle')}</h1>
          <p className="lede">{t('soldLede')}</p>
          {sold.length > 0 && <p className="count num">{t('soldByUs', { n: sold.length })}</p>}
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          {sold.length > 0
            ? <ul className="plain-list grid grid--3">{sold.map((x, i) => <li key={x.id}><ListingCard listing={x} l={l} priority={i === 0} as="h2" /></li>)}</ul>
            : <p className="lede">{t('soldCta')}</p>}
        </div>
      </section>
      <ValuationBand l={l} />
    </Layout>
  );
}
