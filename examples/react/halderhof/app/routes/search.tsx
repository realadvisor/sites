/**
 * Buy and Rent: the kit's ListingsSearch (filters, chips, count, sort, list
 * and map views, pagination, empty states) over one pool of the offer type,
 * with the site's card in its slot. Title, h1 and description follow every
 * active filter.
 */
import type { Route } from './+types/search';
import { ListingsSearch } from '@realadvisor/sites-kit-react/components/ListingsSearch';
import { parseSearch, searchListings } from '@realadvisor/sites-kit-react/lib/search';
import { img } from '@realadvisor/sites-kit/image';
import { count as kcount, lang as klang, t as kt } from '@realadvisor/sites-kit/i18n';
import { Site } from '../components/Site';
import { Crumbs } from '../components/Crumbs';
import { ListingCard } from '../components/ListingCard';
import { cardOf, siteData, sites } from '../lib/data.server';
import { href, langOfPath, listingHref, LOCALE, ROUTES } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { formatAmount, price, typeLabel } from '../lib/format';
import './search.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const l = langOfPath(url.pathname);
  const offer = url.pathname === ROUTES.rent[l] ? ('rent' as const) : ('buy' as const);
  const [{ org, teams }, pool] = await Promise.all([siteData(), sites.allListings({ offer_type: offer })]);
  // The pool is one offer type already: no offer filter (and no offer chip).
  // Sold listings have their own page: this search shows what is on the market.
  const params = { ...parseSearch(url.searchParams), offerType: undefined, status: 'available' as const };
  const cities = joinList(teams.map((x) => cityName(x.address.city, l)).filter(Boolean), l);
  return { l, offer, orgName: org.name, cities, pool: pool.map(cardOf), params };
}

export default function Search({ loaderData: { l, offer, orgName, cities, pool, params } }: Route.ComponentProps) {
  const t = tx(l);
  const locale = LOCALE[l];
  const lg = klang(locale);
  const route = offer === 'buy' ? 'buy' : 'rent';
  const result = searchListings(pool, params, { locale });
  const parts = [
    offer === 'buy' ? t('buyTitle') : t('rentTitle'),
    params.propertyType && typeLabel(params.propertyType, l),
    params.city && t('inCity', { city: cityName(params.city, l) }),
    params.minRooms && kt('roomsMin', { n: String(params.minRooms) }, lg),
    params.maxPrice && kt('priceMax', { price: formatAmount(params.maxPrice) }, lg),
    params.minPrice && kt('priceMin', { price: formatAmount(params.minPrice) }, lg),
  ].filter(Boolean) as string[];
  const heading = parts.join(' · ');
  const suffix = `${params.view === 'map' ? ` – ${t('mapView')}` : ''}${result.page > 1 ? ` – ${t('page')} ${result.page}` : ''}`;
  const first = result.items.find((x) => x.photos[0])?.photos[0];
  return (
    <Site l={l} route={route}
      title={`${heading}${suffix} | ${orgName}`}
      description={`${kcount('listingsFound', result.total, lg)} – ${heading} – ${orgName}`}
      image={first && img(first.url, { w: 1200, h: 630 })}>
      <section className="band on-green">
        <div className="wrap band__inner">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: offer === 'buy' ? t('navBuy') : t('navRent') }]} />
          <h1 className="h1" data-rs-sync="h1">{heading}{suffix}</h1>
          {cities && <p className="lede">{t('searchLede', { cities })}</p>}
          <nav className="switch" aria-label={`${t('navBuy')} / ${t('navRent')}`}>
            <a href={href('buy', l)} aria-current={offer === 'buy' ? 'page' : undefined}>{t('navBuy')}</a>
            <a href={href('rent', l)} aria-current={offer === 'rent' ? 'page' : undefined}>{t('navRent')}</a>
          </nav>
        </div>
      </section>
      <div className="wrap search">
        <ListingsSearch result={result} base={href(route, l)} locale={locale} sold={false}
          filters={['propertyType', 'city', 'price', 'rooms']}
          contactHref={href('contact', l)} valuationHref={href('sell', l)}
          listingHref={(x) => listingHref(x, l)} price={(x) => price(x, l)}>
          {(x, i) => <ListingCard listing={x} l={l} priority={i === 0} as="h2" />}
        </ListingsSearch>
      </div>
    </Site>
  );
}
