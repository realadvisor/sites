/** Sold properties: the sold listings in the card grid, no prices, and a line to the valuation. */
import type { Route } from './+types/sold';
import { Site } from '../components/Site';
import { PageBand } from '../components/PageBand';
import { ListingCard } from '../components/ListingCard';
import { cardOf, siteData, sites } from '../lib/data.server';
import { href, langOfPath } from '../lib/routes';
import { tx } from '../lib/copy';
import './sold.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org }, sold] = await Promise.all([siteData(), sites.allListings({ status: 'sold' })]);
  return { l, orgName: org.name, sold: sold.map(cardOf) };
}

export default function Sold({ loaderData: { l, orgName, sold } }: Route.ComponentProps) {
  const t = tx(l);
  return (
    <Site l={l} route="sold" title={`${t('soldTitle')} | ${orgName}`} description={t('soldLede')}>
      <PageBand l={l} title={t('soldTitle')} lede={t('soldLede')} crumbs={[{ label: t('navSold') }]} />
      <section className="section wrap">
        {sold.length > 0
          ? <ul className="plain-list grid3">{sold.map((x, i) => <li key={x.id}><ListingCard listing={x} l={l} as="h2" priority={i === 0} /></li>)}</ul>
          : <p className="lede">{t('soldLede')}</p>}
        <div className="cta">
          <p className="h3">{t('soldCta')}</p>
          <a className="button" href={href('sell', l)}>{t('valuationCta')}</a>
        </div>
      </section>
    </Site>
  );
}
