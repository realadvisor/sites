/** Sold: past sales in the same grid, "Sold" on the photo, no prices; then the valuation link. */
import type { Route } from './+types/sold';
import { Site } from '../components/Site';
import { PageHead } from '../components/PageHead';
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
  const C = {
    en: { title: 'Sold by Clairval', lede: (n: number) => `${n} ${n === 1 ? 'house' : 'houses'} we sold recently. Prices stay between the buyer and the seller.`, none: 'No sales to show yet.', cta: 'Thinking of selling?', ctaText: 'We value houses in the same areas, with a visit.' },
    fr: { title: 'Vendus par Clairval', lede: (n: number) => `${n} ${n === 1 ? 'maison vendue' : 'maisons vendues'} récemment. Les prix restent entre l’acheteur et le vendeur.`, none: 'Aucune vente à montrer pour l’instant.', cta: 'Vous pensez vendre ?', ctaText: 'Nous estimons les maisons dans les mêmes secteurs, avec une visite.' },
  }[l];
  const title = C.title.replace('Clairval', orgName.replace(/\s+SA$/, ''));
  const lede = sold.length ? C.lede(sold.length) : C.none;
  return (
    <Site l={l} route="sold" title={`${title} | ${orgName}`} description={lede}>
      <PageHead crumbLabel={t('breadcrumb')} crumbs={[{ label: t('home'), href: href('home', l) }, { label: t('navSold') }]} title={title} lede={lede} />
      {sold.length > 0 && (
        <section className="wrap list">
          <ul className="plain grid3">{sold.map((x, i) => <li key={x.id}><ListingCard listing={x} l={l} priority={i === 0} as="h2" /></li>)}</ul>
        </section>
      )}
      <section className="on-ink cta-band">
        <div className="wrap cta-band__in">
          <div>
            <h2 className="h2">{C.cta}</h2>
            <p className="lede">{C.ctaText}</p>
          </div>
          <a className="cta cta--gold" href={href('sell', l)}>{t('valuation')}</a>
        </div>
      </section>
    </Site>
  );
}
