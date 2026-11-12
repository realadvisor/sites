/** Quartieri / Neighbourhoods: every Milan district with listings, as large alternating photo rows. */
import type { Route } from './+types/areas';
import { img } from '@realadvisor/sites-kit-core/image';
import { Site } from '../components/Site';
import { Photo } from '../components/Photo';
import { agency, sites } from '../lib/data.server';
import { brandName, byNewest } from '../lib/data';
import { districtsWithListings } from '../lib/districts';
import { placePhoto } from '../lib/places';
import { districtText } from '../content/content.server';
import { UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import './areas.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, all] = await Promise.all([agency(), sites.allListings()]);
  const districts = districtsWithListings(all).map((d) => {
    const listings = [...d.listings].sort(byNewest);
    const live = listings.filter((l) => l.status === 'available');
    const p = (live[0] ?? listings[0])?.photos[0];
    const photo = (d.place && placePhoto(d.place, lang, 0)) || (p && { url: p.url, alt: p.alt });
    return { slug: d.slug, name: d.name, live: live.length, photo, lead: districtText(d.slug, lang)?.lead };
  });
  return { lang, brand: brandName(ag), districts };
}

export default function Areas({ loaderData: { lang, brand, districts } }: Route.ComponentProps) {
  const ui = UI[lang];
  const homes = (n: number) => (n === 1 ? ui.homeOne : fill(ui.homesN, { n }));
  return (
    <Site lang={lang} current="areas" title={`${ui.areasH1} | ${brand}`} description={ui.areasLead}
      image={districts[0]?.photo ? img(districts[0].photo.url, { w: 1200, h: 630 }) : undefined} alternates={alternates('areas')}>
      <header className="wrap phead">
        <h1 className="d-xl">{ui.areasH1}</h1>
        <p className="lead">{ui.areasLead}</p>
      </header>
      <ul className="wrap list">
        {districts.map((d, i) => (
          <li key={d.slug} className="item">
            <div className="frame item-photo">
              {d.photo && <Photo src={d.photo} alt={d.photo.alt} width={1000} height={700} priority={i === 0} sizes="(min-width: 900px) 52vw, 100vw" />}
            </div>
            <div className="item-text">
              <h2 className="d-xl"><a href={href('areas', lang, d.slug)}>{d.name}</a></h2>
              {d.lead && <p className="lead">{d.lead}</p>}
              <p className="muted num">{homes(d.live)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Site>
  );
}
