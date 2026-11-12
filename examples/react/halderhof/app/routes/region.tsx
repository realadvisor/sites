/** One region: photo band, towns with counts and prices, the listings available, recent sales and the office in charge. */
import type { Route } from './+types/region';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { img } from '@realadvisor/sites-kit/image';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { Crumbs } from '../components/Crumbs';
import { ListingCard } from '../components/ListingCard';
import { TownTable } from '../components/TownTable';
import { findRegion, siteData } from '../lib/data.server';
import { placeOf } from '../content/places';
import { href, langOfPath, teamSlug } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './region.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const r = await findRegion(params.slug);
  if (!r) throw notFound();
  const { org, teams } = await siteData();
  const { listings: _all, ...region } = r;
  return { l, r: region, orgName: org.name, officeSlug: teamSlug(r.team, teams) };
}

export default function Region({ loaderData: { l, r, orgName, officeSlug } }: Route.ComponentProps) {
  const t = tx(l);
  const city = cityName(r.team.address.city, l) || r.team.name;
  const place = placeOf(r.slug);
  const places = joinList(r.towns.map((x) => cityName(x.city, l)), l);
  const buy = r.available.filter((x) => x.offer_type === 'buy');
  const rent = r.available.filter((x) => x.offer_type === 'rent');
  const x = r.team;
  return (
    <Site l={l} route="areas" segs={[r.slug]} title={`${t('regionTitle', { city })} | ${orgName}`}
      description={places ? t('regionLede', { places, city }) : t('regionTitle', { city })} image={place && img(place.photo, { w: 1200, h: 630 })}>
      <section className="hero" data-hero="">
        {place && <Img src={place.photo} alt={place.alt[l]} width={1600} height={700} priority sizes="100vw" mobile={{ width: 800, height: 700 }} />}
        <div className="hero__panel on-green">
          <div className="wrap hero__in">
            <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navAreas'), href: href('areas', l) }, { label: city }]} />
            <h1 className="h1">{t('regionTitle', { city })}</h1>
            {places && <p className="lede">{t('regionLede', { places, city })}</p>}
          </div>
        </div>
      </section>

      <section className="section wrap cols" aria-labelledby="h-towns">
        <div>
          <h2 id="h-towns" className="h3 sec-h">{t('placesTitle')}</h2>
          <TownTable l={l} towns={r.towns} caption={t('placesTitle')} />
        </div>
        <aside className="office" aria-label={t('officeOf', { city })}>
          <h2 className="h3"><a href={href('offices', l, officeSlug)}>{t('officeOf', { city })}</a></h2>
          <address>{[x.address.street, [x.address.postcode, cityName(x.address.city, l)].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</address>
          <ul className="plain-list">
            {x.phone && <li><a className="num" href={tel(x.phone)}>{x.phone}</a></li>}
            {x.email && <li><a href={`mailto:${x.email}`}>{x.email}</a></li>}
          </ul>
          <a className="button" href={href('sell', l)}>{t('valuationCta')}</a>
        </aside>
      </section>

      {r.available.length > 0 ? (
        <section className="section section--paper" aria-labelledby="h-av">
          <div className="wrap">
            <h2 id="h-av" className="h2 sec-h">{t('regionAvailable', { city })}</h2>
            <ul className="plain-list grid3">{[...buy, ...rent].map((y) => <li key={y.id}><ListingCard listing={y} l={l} /></li>)}</ul>
          </div>
        </section>
      ) : (
        <p className="wrap section lede">{t('regionNone', { city })}</p>
      )}

      {r.sold.length > 0 && (
        <section className="section wrap" aria-labelledby="h-sold">
          <h2 id="h-sold" className="h2 sec-h">{t('regionSold', { city })}</h2>
          <ul className="plain-list grid3">{r.sold.map((y) => <li key={y.id}><ListingCard listing={y} l={l} /></li>)}</ul>
        </section>
      )}
    </Site>
  );
}
