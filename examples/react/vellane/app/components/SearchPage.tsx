/**
 * Acheter and Louer: the kit's ListingsSearch (filters, chips, count, sort,
 * list and split map view, pagination, empty states) over one offer type,
 * themed through its tokens, with the site's card in its slot. Title, h1 and
 * description follow every active filter. Filters live in the URL, and
 * "Enregistrer la recherche" keeps that URL in the visitor's favourites.
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { ListingsSearch } from '@realadvisor/sites-kit-react/components/ListingsSearch';
import { parseSearch, searchListings } from '@realadvisor/sites-kit-react/lib/search';
import { img } from '@realadvisor/sites-kit/image';
import { count as kcount, t as kt } from '@realadvisor/sites-kit/i18n';
import { Layout } from './Layout';
import { ListingCard } from './ListingCard';
import { Icon } from './Icon';
import { formatAmount, listingHref, price, R, searchUrl, typeLabel } from '../lib/site';
import './SearchPage.css';

export type Offer = 'buy' | 'rent';

export type SearchData = { offer: Offer; orgName: string; pool: Listing[]; params: ReturnType<typeof parseSearch> };

export function SearchPage({ offer, orgName, pool, params: p }: SearchData) {
  // One offer type per page: no offer filter. Sold listings have their own page (/vendus).
  const params = { ...p, offerType: undefined, status: 'available' as const };
  const result = searchListings(pool, params, { locale: 'fr-FR' });
  const base = offer === 'buy' ? R.buy : R.rent;
  const isMap = params.view === 'map';
  const lead = offer === 'buy' ? 'Biens à vendre' : 'Biens à louer';
  const parts = [
    params.propertyType ? `${typeLabel(params.propertyType)}${offer === 'buy' ? ' à vendre' : ' à louer'}` : lead,
    params.city && `à ${params.city}`,
    params.minRooms && kt('roomsMin', { n: String(params.minRooms) }, 'fr'),
    params.maxPrice && kt('priceMax', { price: formatAmount(params.maxPrice) }, 'fr'),
    params.minPrice && kt('priceMin', { price: formatAmount(params.minPrice) }, 'fr'),
  ].filter(Boolean) as string[];
  const heading = parts.join(' · ').replace(' · à ', ' à ');
  const suffix = `${isMap ? ' – carte' : ''}${result.page > 1 ? ` – page ${result.page}` : ''}`;
  const first = result.items.find((x) => x.photos[0])?.photos[0];
  const sizes = isMap ? '(min-width: 1280px) 300px, (min-width: 960px) 40vw, 100vw' : '(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw';
  return (
    <Layout nav={offer} title={`${heading}${suffix} | ${orgName.replace(/\s+SAS$/, '')}`}
      description={`${kcount('listingsFound', result.total, 'fr')} – ${heading}. Annonces de nos agences de Lyon et Bordeaux, sur la carte ou en liste.`}
      image={first && img(first.url, { w: 1200, h: 630 })}>
      <div className={isMap ? 'sv sv--map' : 'sv'}>
        <div className="sv__head">
          <nav className="sv__switch" aria-label="Acheter ou louer">
            <a href={searchUrl('buy')} aria-current={offer === 'buy' ? 'page' : undefined}>Acheter</a>
            <a href={searchUrl('rent')} aria-current={offer === 'rent' ? 'page' : undefined}>Louer</a>
          </nav>
          <h1 className="sv__h1" data-rs-sync="h1">{heading}{suffix}</h1>
          <button type="button" className="sv__save" data-save-search="" hidden aria-pressed="false">
            <Icon name="bookmark" size={18} /><span data-label="">Enregistrer la recherche</span>
          </button>
        </div>
        <ListingsSearch result={result} base={base} locale="fr-FR" sold={false}
          filters={['propertyType', 'city', 'price', 'rooms']}
          contactHref={R.contact} valuationHref={R.sell}
          listingHref={listingHref} price={price}>
          {(l, i) => <ListingCard listing={l} priority={i === 0} as="h2" sizes={sizes} />}
        </ListingsSearch>
      </div>
    </Layout>
  );
}
