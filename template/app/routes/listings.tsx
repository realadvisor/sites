/**
 * The listing search. Keep this structure on every agency site: one pool
 * (`sites.allListings()`), `searchListings`, and <ListingsSearch> for
 * filters, chips, list / map, pagination and empty states. Design the
 * heading, the intro and the card (the children), and theme the rest with
 * tokens (DESIGN.md 4.4). Renamed path (/proprietes): pass `base` and keep
 * the filter params.
 */
import type { Route } from './+types/listings';
import { ListingsSearch } from '@realadvisor/sites-kit-react/components/ListingsSearch';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { parseSearch, searchListings } from '@realadvisor/sites-kit-react/lib/search';
import { formatAmount, formatPrice, listingUrl } from '@realadvisor/sites-kit-core/format';
import { img } from '@realadvisor/sites-kit-core/image';
import { count, offerTypeLabel, propertyTypeLabel, t } from '@realadvisor/sites-kit-core/i18n';
import { Layout } from '../components/Layout';
import { agency, sites } from '../lib/data.server';

export async function loader({ request }: Route.LoaderArgs) {
  const params = parseSearch(new URL(request.url).searchParams);
  const [a, pool] = await Promise.all([agency(), sites.allListings()]);
  return { name: a.name, pool, params };
}

export default function Page({ loaderData: { name, pool, params } }: Route.ComponentProps) {
  const result = searchListings(pool, params);
  // Title, h1 and description carry every active filter: no two URLs share one.
  const heading = [
    params.status === 'sold' ? t('soldListings') : params.offerType ? offerTypeLabel(params.offerType) : t('allListings'),
    params.propertyType && propertyTypeLabel(params.propertyType),
    params.city,
    params.minRooms && t('roomsMin', { n: String(params.minRooms) }),
    params.minPrice && t('priceMin', { price: formatAmount(params.minPrice) }),
    params.maxPrice && t('priceMax', { price: formatAmount(params.maxPrice) }),
  ].filter(Boolean).join(' · ');
  const suffix = `${params.view === 'map' ? ` – ${t('viewMap')}` : ''}${result.page > 1 ? ` – ${t('page')} ${result.page}` : ''}`;
  const first = result.items.find((l) => l.photos[0])?.photos[0];
  return (
    <Layout
      title={`${heading}${suffix} | ${name}`}
      description={`${count('listingsFound', result.total)} – ${heading} – ${name}`}
      image={first && img(first.url, { w: 1200, h: 630 })}
    >
      <div className="listings">
        <h1 data-rs-sync="h1">{heading}{suffix}</h1>
        <ListingsSearch result={result} contactHref="/contact" valuationHref="/contact#valuation">
          {(l, i) => (
            // Wiring example of the design's card: replace with your ListingCard.
            <a href={listingUrl(l)}>
              {l.photos[0]
                ? <RaImage src={l.photos[0]} width={600} height={400} priority={i === 0} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" alt={l.photos[0].alt ?? l.title} />
                : <span aria-hidden="true">{propertyTypeLabel(l.property_type)}</span>}
              {l.title} · {formatPrice(l)}
            </a>
          )}
        </ListingsSearch>
      </div>
    </Layout>
  );
}
