/** Offices: a map with one pin per office, then each office with its photo, address, contacts, team and listing count. */
import { Fragment } from 'react';
import type { Route } from './+types/offices';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { PageBand } from '../components/PageBand';
import { StaticMap } from '../components/StaticMap';
import { siteData, sites } from '../lib/data.server';
import { placeOf } from '../content/places';
import { agentSlug, href, langOfPath, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './offices.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org, teams, agents }, all] = await Promise.all([siteData(), sites.allListings({ status: 'available' })]);
  const offices = teams.map((x) => ({
    team: x,
    slug: teamSlug(x, teams),
    crew: agents.filter((a) => a.team_ids.includes(x.id)).map((a) => ({ id: a.id, name: `${a.first_name} ${a.last_name}`, slug: agentSlug(a, agents) })),
    n: all.filter((y) => y.team_ids.includes(x.id)).length,
  }));
  return { l, orgName: org.name, offices };
}

export default function Offices({ loaderData: { l, orgName, offices } }: Route.ComponentProps) {
  const t = tx(l);
  const pts = offices.map((o) => o.team).filter((x) => x.address.lat != null && x.address.lng != null);
  const lat = pts.length ? (Math.min(...pts.map((x) => x.address.lat!)) + Math.max(...pts.map((x) => x.address.lat!))) / 2 : undefined;
  const lng = pts.length ? (Math.min(...pts.map((x) => x.address.lng!)) + Math.max(...pts.map((x) => x.address.lng!))) / 2 : undefined;
  const slugOf = (id: string) => offices.find((o) => o.team.id === id)!.slug;
  return (
    <Site l={l} route="offices" title={`${t('officesTitle')} | ${orgName}`} description={t('officesLede')}>
      <PageBand l={l} title={t('officesTitle')} lede={t('officesLede')} crumbs={[{ label: t('navOffices') }]} />
      <div className="wrap section offices">
        {offices.map(({ team: x, slug, crew, n }, i) => {
          const city = cityName(x.address.city, l) || x.name;
          const place = placeOf(slug);
          return (
            <article key={x.id} className="office">
              <a className="office__media" href={href('offices', l, slug)} tabIndex={-1} aria-hidden="true">
                {place && <Img src={place.photo} alt="" width={960} height={640} sizes="(min-width: 900px) 46vw, 100vw" priority={i === 0} />}
              </a>
              <div className="office__body">
                <h2 className="h2"><a href={href('offices', l, slug)}>{t('officeOf', { city })}</a></h2>
                <address>
                  {x.address.street && <span>{x.address.street}</span>}
                  {(x.address.postcode || x.address.city) && <span>{[x.address.postcode, cityName(x.address.city, l)].filter(Boolean).join(' ')}</span>}
                </address>
                <ul className="plain-list links">
                  {x.phone && <li><a className="num" href={tel(x.phone)}>{x.phone}</a></li>}
                  {x.email && <li><a href={`mailto:${x.email}`}>{x.email}</a></li>}
                </ul>
                {x.description_text && <p className="muted">{x.description_text}</p>}
                {crew.length > 0 && (
                  <p className="crew"><span>{t('team')}:</span> {crew.map((a, j) => <Fragment key={a.id}>{j > 0 && ', '}<a href={href('team', l, a.slug)}>{a.name}</a></Fragment>)}</p>
                )}
                {n > 0 && <a className="more" href={href('offices', l, slug)}>{t('officeListings', { city })} ({n})</a>}
              </div>
            </article>
          );
        })}
      </div>
      {lat != null && lng != null && pts.length > 1 && (
        <div className="wrap mapwrap section">
          <StaticMap lat={lat} lng={lng} zoom={8} height={420} label={t('officeMap')} linkLabel={t('openMap')}
            points={pts.map((x) => ({ lat: x.address.lat!, lng: x.address.lng!, label: cityName(x.address.city, l) || x.name, href: href('offices', l, slugOf(x.id)) }))} />
        </div>
      )}
    </Site>
  );
}
