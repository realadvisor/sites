/** Regions: one per office, with its photo, the towns where it has listings (counts and asking prices) and a link to the region page. */
import type { Route } from './+types/regions';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { PageBand } from '../components/PageBand';
import { TownTable } from '../components/TownTable';
import { regionList, siteData } from '../lib/data.server';
import { placeOf } from '../content/places';
import { href, langOfPath } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import './regions.css';

const slim = <T extends { price?: number; price_on_request?: boolean }>(xs: T[]) => xs.map((x) => ({ price: x.price, price_on_request: x.price_on_request }));

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org }, list] = await Promise.all([siteData(), regionList()]);
  const regions = list.map((r) => ({
    slug: r.slug,
    city: r.team.address.city,
    teamName: r.team.name,
    towns: r.towns.map((x) => ({ city: x.city, buy: slim(x.buy), rent: slim(x.rent), sold: slim(x.sold) })),
  }));
  return { l, orgName: org.name, regions };
}

export default function Regions({ loaderData: { l, orgName, regions } }: Route.ComponentProps) {
  const t = tx(l);
  return (
    <Site l={l} route="areas" title={`${t('regionsPageTitle')} | ${orgName}`} description={t('regionsLede')}>
      <PageBand l={l} title={t('regionsPageTitle')} lede={t('regionsLede')} crumbs={[{ label: t('navAreas') }]} />
      <div className="wrap section list">
        {regions.map((r, i) => {
          const city = cityName(r.city, l) || r.teamName;
          const place = placeOf(r.slug, 1);
          return (
            <article key={r.slug} className="region">
              <a className="region__media" href={href('areas', l, r.slug)} tabIndex={-1} aria-hidden="true">
                {place && <Img src={place.photo} alt="" width={900} height={600} sizes="(min-width: 900px) 40vw, 100vw" priority={i === 0} />}
              </a>
              <div className="region__body">
                <h2 className="h2"><a href={href('areas', l, r.slug)}>{t('regionOf', { city })}</a></h2>
                <TownTable l={l} towns={r.towns} caption={t('regionOf', { city })} />
                <a className="more" href={href('areas', l, r.slug)}>{t('regionTitle', { city })}</a>
              </div>
            </article>
          );
        })}
      </div>
    </Site>
  );
}
