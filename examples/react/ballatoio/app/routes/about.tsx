/** Chi siamo / About: where the name comes from, what the agency sells now (counted from the data), how a sale works, the team. */
import type { Route } from './+types/about';
import { img } from '@realadvisor/sites-kit/image';
import { Site } from '../components/Site';
import { AgentBlock } from '../components/AgentBlock';
import { Photo } from '../components/Photo';
import { agency, sites } from '../lib/data.server';
import { brandName } from '../lib/data';
import { districtsWithListings } from '../lib/districts';
import { placePhoto } from '../lib/places';
import { UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import './about.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, all, agents] = await Promise.all([agency(), sites.allListings(), sites.agents()]);
  const live = all.filter((l) => l.status === 'available');
  return {
    lang,
    brand: brandName(ag),
    agents,
    sale: live.filter((l) => l.offer_type === 'buy').length,
    rent: live.filter((l) => l.offer_type === 'rent').length,
    areas: districtsWithListings(live).length,
    photo: placePhoto('milano', lang, 2),
    photo2: placePhoto('brera', lang, 1),
  };
}

export default function About({ loaderData: { lang, brand, agents, sale, rent, areas, photo, photo2 } }: Route.ComponentProps) {
  const ui = UI[lang];
  return (
    <Site lang={lang} current="about" title={`${ui.aboutH1} | ${brand}`} description={ui.aboutLine}
      image={photo && img(photo.url, { w: 1200, h: 630 })} alternates={alternates('about')}>
      <header className="wrap phead">
        <h1 className="d-xl">{ui.aboutH1}</h1>
        <p className="lead">{ui.aboutLine}</p>
      </header>

      <section className="wrap story">
        {photo && (
          <div className="frame story-photo">
            <Photo src={photo} alt={photo.alt} width={1000} height={1250} priority sizes="(min-width: 900px) 42vw, 100vw" mobile={{ width: 800, height: 700 }} />
          </div>
        )}
        <div className="story-text">
          {ui.aboutBody.map((p, i) => <p key={i} className={i === 0 ? 'big' : undefined}>{p}</p>)}
          {(sale > 0 || rent > 0) && (
            <div className="now">
              <h2 className="label muted">{ui.nowTitle}</h2>
              <p>{fill(ui.nowLine, { sale, rent, areas })}</p>
              <p className="now-links">
                {sale > 0 && <a className="arrow-link" href={href('buy', lang)}>{ui.nav.buy} <span aria-hidden="true">→</span></a>}
                {rent > 0 && <a className="arrow-link" href={href('rent', lang)}>{ui.nav.rent} <span aria-hidden="true">→</span></a>}
              </p>
            </div>
          )}
        </div>
      </section>

      {photo2 && (
        <div className="wrap wide">
          <div className="frame wide-photo"><Photo src={photo2} alt={photo2.alt} width={1600} height={900} sizes="(min-width: 1520px) 1424px, 100vw" /></div>
        </div>
      )}

      <section className="wrap how" aria-labelledby="how-h">
        <h2 id="how-h" className="d-l">{ui.howTitle}</h2>
        <dl className="how-list">
          {ui.steps.map(([k, v]) => <div key={k}><dt className="d-m">{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </section>

      {agents.length > 0 && (
        <section className="wrap people" aria-labelledby="people-h">
          <h2 id="people-h" className="d-l"><a href={href('team', lang)}>{ui.teamH1}</a></h2>
          <ul className="people-list">
            {agents.map((a) => <li key={a.id}><AgentBlock agent={a} lang={lang} /></li>)}
          </ul>
        </section>
      )}
    </Site>
  );
}
