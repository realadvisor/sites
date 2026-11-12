/**
 * Kaufen / Mieten: the kit's ListingsSearch (filters, chips, list and map,
 * pagination, empty states) over this offer type's available listings, with
 * the site's own card. Title, h1 and description carry every active filter.
 */
import type { OfferType } from '@realadvisor/sites-sdk/types';
import { ListingsSearch } from '@realadvisor/sites-kit-react/components/ListingsSearch';
import { parseSearch, searchListings } from '@realadvisor/sites-kit-react/lib/search';
import { formatAmount } from '@realadvisor/sites-kit-core/format';
import { img } from '@realadvisor/sites-kit-core/image';
import { count, propertyTypeLabel, t } from '@realadvisor/sites-kit-core/i18n';
import { Layout } from './Layout';
import { ListingCard } from './ListingCard';
import { listingUrl } from '../lib/urls';
import { price } from '../lib/format';
import type { Site } from '../lib/data.server';
import type { Listing } from '@realadvisor/sites-sdk/types';
import './SearchPage.css';

/** Loader of /kaufen and /mieten. */
export async function searchLoader(request: Request, offer: OfferType, deps: { site: () => Promise<Site>; pool: () => Promise<Listing[]>; brand: (s: Site) => string }) {
  const params = parseSearch(new URL(request.url).searchParams);
  const [s, pool] = await Promise.all([deps.site(), deps.pool()]);
  return { offer, brand: deps.brand(s), pool, params };
}

type Props = { offer: OfferType; brand: string; pool: Listing[]; params: ReturnType<typeof parseSearch> };

export function SearchPage({ offer, brand, pool, params }: Props) {
  const base = offer === 'buy' ? '/kaufen' : '/mieten';
  const verb = offer === 'buy' ? 'Kaufen' : 'Mieten';
  const result = searchListings(pool, { ...params, offerType: undefined, status: 'available' });
  const parts = [
    verb,
    params.propertyType && propertyTypeLabel(params.propertyType),
    params.city,
    params.minRooms && t('roomsMin', { n: String(params.minRooms) }),
    params.minPrice && t('priceMin', { price: formatAmount(params.minPrice) }),
    params.maxPrice && t('priceMax', { price: formatAmount(params.maxPrice) }),
  ].filter(Boolean);
  const heading = parts.join(' · ');
  const suffix = `${params.view === 'map' ? ` – ${t('viewMap')}` : ''}${result.page > 1 ? ` – ${t('page')} ${result.page}` : ''}`;
  const first = result.items.find((l) => l.photos[0])?.photos[0];
  const lede = offer === 'buy' ? 'Wohnungen, Häuser und Villen am Zürichsee, in der Stadt und in Zug.' : 'Wohnungen und Häuser zur Miete, möbliert und unmöbliert.';
  return (
    <Layout
      title={`${heading}${suffix} | ${brand}`}
      description={`${count('listingsFound', result.total)} – ${heading} – ${brand}`}
      image={first && img(first.url, { w: 1200, h: 630 })}
    >
      <div className="sp wrap">
        <header className="sp-head">
          <h1 className="h1" data-rs-sync="h1">{heading}{suffix}</h1>
          <p className="lede muted">{lede}</p>
        </header>
        <ListingsSearch
          result={result}
          base={base}
          sold={false}
          filters={['propertyType', 'city', 'price', 'rooms']}
          contactHref="/kontakt"
          valuationHref="/verkaufen#bewertung"
          listingHref={listingUrl}
          price={price}
        >
          {(l, i) => <ListingCard listing={l} priority={i === 0} as="h2" />}
        </ListingsSearch>
      </div>
    </Layout>
  );
}
