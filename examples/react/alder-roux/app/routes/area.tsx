/**
 * One area (a city with 3+ listings): photo hero, short introduction (site
 * content), figures computed from its listings, the office that covers it,
 * its listings for sale and to rent, and what sold there.
 */
import type { Route } from './+types/area';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { ListingCard } from '../components/ListingCard';
import { PlacePhoto } from '../components/PlacePhoto';
import { siteData, sites } from '../lib/data.server';
import { href, langOf, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { formatAmount, formatSurface, range, tel, typeLabel } from '../lib/format';
import { areasOf, officeFor } from '../lib/areas';
import { areaPlace, placeAlt, placeOg } from '../content/places';
import './area.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOf(new URL(request.url).pathname);
  const [{ org, teams }, all] = await Promise.all([siteData(), sites.allListings()]);
  const area = areasOf(all).find((a) => a.slug === params.slug);
  if (!area) throw notFound();
  const here = all.filter((x) => x.address.city === area.city);
  const office = officeFor(area.city, here, teams);
  return { l, name: org.name, slug: area.slug, city: area.city, here, office: office && { ...office, slug: teamSlug(office, teams) } };
}

export default function Page({ loaderData: { l, name, slug, city: localCity, here, office } }: Route.ComponentProps) {
  const t = tx(l);
  const avail = here.filter((x) => x.status === 'available');
  const buy = avail.filter((x) => x.offer_type === 'buy');
  const rent = avail.filter((x) => x.offer_type === 'rent');
  const sold = here.filter((x) => x.status === 'sold');
  const place = areaPlace(localCity, office?.address.city);
  const city = cityName(localCity, l);
  const prices = buy.map((x) => x.price).filter((p): p is number => !!p && p > 0);
  const surfaces = avail.map((x) => x.living_surface).filter((s): s is number => !!s);
  const types = [...new Set(avail.map((x) => typeLabel(x.property_type, l)))];
  const facts = [
    buy.length > 0 && { k: t('areaForSale'), v: String(buy.length) },
    rent.length > 0 && { k: t('areaForRent'), v: String(rent.length) },
    prices.length > 0 && { k: t('areaPriceRange'), v: range({ min: Math.min(...prices), max: Math.max(...prices) }, formatAmount) },
    surfaces.length > 0 && { k: t('areaSurfaces'), v: range({ min: Math.min(...surfaces), max: Math.max(...surfaces) }, (n) => formatSurface(n)) },
    types.length > 0 && { k: t('propertyType'), v: types.join(', ') },
  ].filter(Boolean) as { k: string; v: string }[];
  const officeCity = office ? cityName(office.address.city, l) || office.name : '';
  return (
    <Layout l={l} route="areas" segs={[slug]} title={`${t('homesIn', { city })} | ${name}`}
      description={place?.intro?.[l] ?? `${t('homesIn', { city })} · ${name}`}
      image={place && placeOg(place)}>
      <section className="hero">
        {place && <PlacePhoto place={place} alt={placeAlt(place, l)} width={1600} height={700} priority sizes="100vw" mobile={{ width: 800, height: 900 }} />}
        <div className="hero__shade"></div>
        <div className="wrap hero__copy on-navy">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navAreas'), href: href('areas', l) }, { label: city }]} />
          <h1 className="h1">{t('homesIn', { city })}</h1>
          {place?.intro && <p className="lede">{place.intro[l]}</p>}
        </div>
      </section>

      <section className="wrap summary">
        {facts.length > 0 && (
          <dl className="kv summary__facts">{facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}</dl>
        )}
        {office && (
          <aside className="office">
            <span className="eyebrow">{t('nearestOffice', { city })}</span>
            <p className="office__name"><a href={href('offices', l, office.slug)}>{t('officeOf', { city: officeCity })}</a></p>
            <p className="office__addr">{[office.address.street, [office.address.postcode, cityName(office.address.city, l)].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</p>
            {office.phone && <a className="button" href={tel(office.phone)}>{t('call')} <span className="num">{office.phone}</span></a>}
          </aside>
        )}
      </section>

      <section className="section">
        <div className="wrap">
          <div className="head"><div><h2 className="h2">{t('areaAvailable', { city })}</h2></div>
            {buy.length > 0 && <a className="link" href={`${href('buy', l)}?city=${encodeURIComponent(localCity)}`}>{t('seeAllBuy')}</a>}
          </div>
          {avail.length > 0
            ? <ul className="plain-list grid grid--3">{[...buy, ...rent].map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
            : <p className="lede">{t('areaNone', { city, office: officeCity })}</p>}
        </div>
      </section>

      {sold.length > 0 && (
        <section className="section section--paper">
          <div className="wrap">
            <div className="head"><div><h2 className="h2">{t('areaSold', { city })}</h2></div></div>
            <ul className="plain-list grid grid--3">{sold.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
          </div>
        </section>
      )}
    </Layout>
  );
}
