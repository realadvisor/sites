/** Offices: a map with one pin per office, then each office as a row (photo, address, phone, e-mail, agents). */
import type { Route } from './+types/offices';
import { Site } from '../components/Site';
import { PageHead } from '../components/PageHead';
import { Img } from '../components/Img';
import { StaticMap } from '../components/StaticMap';
import { siteData, sites } from '../lib/data.server';
import { href, langOfPath, teamSlug } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { tel } from '../lib/format';
import { placeOf } from '../content/places';
import './offices.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org, teams, agents }, all] = await Promise.all([siteData(), sites.allListings({ status: 'available' })]);
  return {
    l,
    orgName: org.name,
    cities: joinList(teams.map((x) => cityName(x.address.city, l)).filter(Boolean), l),
    offices: teams.map((x) => {
      const slug = teamSlug(x, teams);
      const photo = placeOf(slug)?.photos[0];
      return {
        id: x.id, slug, name: x.name, address: x.address, phone: x.phone, email: x.email,
        photo: photo && { url: photo.url, alt: photo.alt[l] },
        nAgents: agents.filter((a) => a.team_ids.includes(x.id)).length,
        nListings: all.filter((y) => y.team_ids.includes(x.id)).length,
      };
    }),
  };
}

export default function Offices({ loaderData: { l, orgName, cities, offices } }: Route.ComponentProps) {
  const t = tx(l);
  const C = {
    en: { title: 'Our offices', lede: `${offices.length} offices: ${cities}.`, agents: (n: number) => `${n} ${n === 1 ? 'agent' : 'agents'}`, listings: (n: number) => `${n} ${n === 1 ? 'property' : 'properties'}`, map: 'Map of the offices', osm: 'Open the map', page: 'Office page' },
    fr: { title: 'Nos bureaux', lede: `${offices.length} bureaux : ${cities}.`, agents: (n: number) => `${n} ${n === 1 ? 'agent' : 'agents'}`, listings: (n: number) => `${n} ${n === 1 ? 'bien' : 'biens'}`, map: 'Carte des bureaux', osm: 'Ouvrir la carte', page: 'Page du bureau' },
  }[l];
  const pts = offices.filter((x) => x.address.lat != null && x.address.lng != null);
  const lat = pts.length ? (Math.min(...pts.map((p) => p.address.lat!)) + Math.max(...pts.map((p) => p.address.lat!))) / 2 : 0;
  const lng = pts.length ? (Math.min(...pts.map((p) => p.address.lng!)) + Math.max(...pts.map((p) => p.address.lng!))) / 2 : 0;
  return (
    <Site l={l} route="offices" title={`${C.title} | ${orgName}`} description={C.lede}>
      <PageHead crumbLabel={t('breadcrumb')} crumbs={[{ label: t('home'), href: href('home', l) }, { label: t('navOffices') }]} title={C.title} lede={C.lede} />
      <ul className="plain wrap offices">
        {offices.map((x, i) => (
          <li key={x.id} className="office">
            {x.photo && <Img src={x.photo.url} alt={x.photo.alt} width={800} height={600} sizes="(min-width: 1024px) 40vw, 100vw" priority={i === 0} />}
            <div className="office__text">
              <h2 className="h2"><a href={href('offices', l, x.slug)}>{cityName(x.address.city, l) || x.name}</a></h2>
              <address>
                {x.address.street && <span>{x.address.street}</span>}
                <span>{[x.address.postcode, x.address.city].filter(Boolean).join(' ')}{x.address.country && `, ${x.address.country === 'Switzerland' ? (l === 'fr' ? 'Suisse' : 'Switzerland') : x.address.country}`}</span>
              </address>
              <ul className="plain office__c">
                {x.phone && <li><a className="num" href={tel(x.phone)}>{x.phone}</a></li>}
                {x.email && <li><a href={`mailto:${x.email}`}>{x.email}</a></li>}
              </ul>
              <p className="muted">{C.agents(x.nAgents)} · {C.listings(x.nListings)}</p>
              <a className="link" href={href('offices', l, x.slug)}>{C.page}</a>
            </div>
          </li>
        ))}
      </ul>
      {pts.length > 1 && (
        <div className="wrap offices-map">
          <StaticMap lat={lat} lng={lng} zoom={7} height={520} label={C.map} linkLabel={C.osm}
            points={pts.map((p) => ({ lat: p.address.lat!, lng: p.address.lng!, label: cityName(p.address.city, l), href: href('offices', l, p.slug) }))} />
        </div>
      )}
    </Site>
  );
}
