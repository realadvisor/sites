/**
 * Comprare / Buy and Affittare / Rent: the kit's ListingsSearch (filters,
 * chips, list / map, pagination, empty states) over one offer's pool, with
 * the site's card in its slot. Themed through its tokens and rs-* hooks.
 */
import { redirect } from 'react-router';
import type { Route } from './+types/search';
import { ListingsSearch } from '@realadvisor/sites-kit-react/components/ListingsSearch';
import { parseSearch, searchListings } from '@realadvisor/sites-kit-react/lib/search';
import { img } from '@realadvisor/sites-kit/image';
import { formatAmount } from '@realadvisor/sites-kit/format';
import { propertyTypeLabel, t } from '@realadvisor/sites-kit/i18n';
import { Site } from '../components/Site';
import { ListingCard } from '../components/ListingCard';
import { agency, cardOf, sites } from '../lib/data.server';
import { brandName } from '../lib/data';
import { LOCALE_OF, UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import { price } from '../lib/format';
import './search.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const lang = langOfPath(url.pathname);
  const offer = url.pathname === href('rent', lang) ? 'rent' : 'buy';
  // A search form without JS may send ?offerType=rent here: forward to the rent page.
  if (offer === 'buy' && url.searchParams.get('offerType') === 'rent') {
    const q = new URLSearchParams(url.searchParams);
    q.delete('offerType');
    throw redirect(`${href('rent', lang)}${q.size ? `?${q}` : ''}`, 303);
  }
  const [ag, pool] = await Promise.all([agency(), sites.allListings({ offer_type: offer })]);
  // The page is the offer: an offerType in the URL is ignored. Sold homes have their own page.
  const params = { ...parseSearch(url.searchParams), offerType: undefined, status: 'available' as const };
  return { lang, offer, brand: brandName(ag), pool: pool.map(cardOf), params } as const;
}

export default function Search({ loaderData: { lang, offer, brand, pool, params } }: Route.ComponentProps) {
  const ui = UI[lang];
  const locale = LOCALE_OF[lang];
  const route = offer === 'buy' ? 'buy' : 'rent';
  const result = searchListings(pool, params, { locale });
  const base = offer === 'buy' ? ui.buyH1 : ui.rentH1;
  const filters = [
    params.propertyType && propertyTypeLabel(params.propertyType, locale),
    params.city,
    params.minRooms && t('roomsMin', { n: String(params.minRooms) }, lang),
    params.minPrice && t('priceMin', { price: formatAmount(params.minPrice) }, lang),
    params.maxPrice && t('priceMax', { price: formatAmount(params.maxPrice) }, lang),
  ].filter(Boolean) as string[];
  const heading = [base, ...filters].join(' · ');
  const suffix = [params.view === 'map' ? ui.map : '', result.page > 1 ? fill(ui.pageN, { n: result.page }) : ''].filter(Boolean).join(', ');
  const title = `${heading}${suffix ? ` (${suffix})` : ''} | ${brand}`;
  const first = result.items.find((l) => l.photos[0])?.photos[0];
  const lead = offer === 'buy' ? ui.buyLead : ui.rentLead;
  return (
    <Site lang={lang} current={route} title={title}
      description={`${heading}. ${lead}`.slice(0, 158)}
      image={first ? img(first.url, { w: 1200, h: 630 }) : undefined}
      alternates={alternates(route)}>
      <header className="wrap phead">
        <h1 className="d-xl" data-rs-sync="h1">{heading}</h1>
        <p className="lead">{lead}</p>
      </header>
      <div className="wrap results">
        <ListingsSearch result={result} base={href(route, lang)} locale={locale} sold={false}
          filters={['propertyType', 'city', 'price', 'rooms']}
          contactHref={href('contact', lang)} valuationHref={href('sell', lang)}
          listingHref={(x) => href('listing', lang, x.slug)} price={(x) => price(x, lang)}>
          {(x, i) => (
            <ListingCard listing={x} lang={lang} heading="h2" priority={i === 0}
              sizes={params.view === 'map' ? '(min-width: 1280px) 340px, (min-width: 960px) 40vw, 100vw' : '(min-width: 1520px) 700px, (min-width: 760px) 48vw, 100vw'} />
          )}
        </ListingsSearch>
      </div>
    </Site>
  );
}
