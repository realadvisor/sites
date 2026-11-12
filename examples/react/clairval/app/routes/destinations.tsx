/** Destinations: one full-width band per office region, photo and one line, with live counts. */
import type { Route } from './+types/destinations';
import { Site } from '../components/Site';
import { PageHead } from '../components/PageHead';
import { Img } from '../components/Img';
import { siteData, sites } from '../lib/data.server';
import { href, langOfPath } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { destinations } from '../lib/regions';
import { placeOf } from '../content/places';
import './destinations.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org, teams }, all] = await Promise.all([siteData(), sites.allListings()]);
  const dests = destinations(teams, all).map((d) => {
    const p = placeOf(d.slug);
    const photo = p?.photos[0] ? { url: p.photos[0].url, alt: p.photos[0].alt[l] } : d.available[0]?.photos[0];
    return {
      slug: d.slug,
      city: d.team.address.city,
      name: cityName(d.team.address.city, l) || d.team.name,
      line: p?.line[l],
      photo,
      count: d.available.length,
      places: d.places.slice(0, 4).map((x) => x.city),
      nPlaces: d.places.length,
    };
  });
  return { l, orgName: org.name, dests };
}

export default function Destinations({ loaderData: { l, orgName, dests } }: Route.ComponentProps) {
  const t = tx(l);
  const C = {
    en: { title: 'Destinations', lede: 'Where we sell and let, and what you find there.', props: (n: number) => `${n} ${n === 1 ? 'property' : 'properties'} available` },
    fr: { title: 'Destinations', lede: 'Où nous vendons et louons, et ce que vous y trouvez.', props: (n: number) => `${n} ${n === 1 ? 'bien disponible' : 'biens disponibles'}` },
  }[l];
  return (
    <Site l={l} route="destinations" title={`${C.title} | ${orgName}`} description={`${C.title}: ${joinList(dests.map((d) => cityName(d.city, l)), l)}`}>
      <PageHead crumbLabel={t('breadcrumb')} crumbs={[{ label: t('home'), href: href('home', l) }, { label: t('navDestinations') }]} title={C.title} lede={C.lede} />
      <ul className="plain bands">
        {dests.map((d, i) => (
          <li key={d.slug}>
            <a className="band on-ink" href={href('destinations', l, d.slug)}>
              {d.photo && <Img src={d.photo} alt={d.photo.alt ?? ''} width={1600} height={700} sizes="100vw" priority={i === 0} mobile={{ width: 800, height: 900 }} />}
              <span className="band__scrim" aria-hidden="true"></span>
              <span className="wrap band__text">
                <span className="band__name">{d.name}</span>
                {d.line && <span className="band__line">{d.line}</span>}
                <span className="band__count">{C.props(d.count)}{d.nPlaces > 1 && ` · ${joinList(d.places.map((x) => cityName(x, l)), l)}`}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Site>
  );
}
