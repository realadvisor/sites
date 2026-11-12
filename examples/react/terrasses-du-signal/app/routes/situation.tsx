// Location: Lavaux, the lake, transport, schools and daily life (written
// site content, app/content/place.ts), photos of the region and a map.
import type { Route } from './+types/situation';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { StaticMap } from '../components/StaticMap';
import { ContactBand } from '../components/ContactBand';
import { BucketPhoto } from '../components/BucketPhoto';
import { loadSite } from '../lib/data.server';
import { PLACES, sections } from '../content/place';
import './situation.css';

export async function loader() {
  return { site: await loadSite() };
}

export default function Situation({ loaderData }: Route.ComponentProps) {
  const { site } = loaderData;
  const { dev } = site;
  const addr = [dev.address.street, [dev.address.postcode, dev.address.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const photos = PLACES.photos;
  const SECTIONS = sections(dev.address);
  return (
    <Layout
      title={`Situation : ${dev.address.city}, Lavaux et le Léman | ${dev.title}`}
      description={`${dev.title} à ${dev.address.city} : les vignes de Lavaux, le Léman, la gare CFF, Lausanne et le plan de situation.`}
      image={img(PLACES.hero.url, { w: 1200, h: 630 })}
    >
      <section className="hero sit-hero">
        <Photo src={PLACES.hero.url} alt={PLACES.hero.alt} width={1600} height={800} priority sizes="100vw" mobile={{ width: 800, height: 900 }} className="hero-img" />
        <div className="scrim" aria-hidden="true"></div>
        <div className="wrap hero-inner">
          <h1 data-rise="">Situation à {dev.address.city}</h1>
        </div>
      </section>

      <nav className="wrap toc" aria-label="Sur cette page">
        <ul>
          {SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.eyebrow}</a></li>)}
          <li><a href="#plan">Plan</a></li>
        </ul>
      </nav>

      <div className="wrap sections">
        {SECTIONS.map((s, i) => {
          const p = photos[i];
          return (
            <section key={s.id} id={s.id} className={['sec', i % 2 === 1 && 'flip', !p && 'solo'].filter(Boolean).join(' ')} aria-labelledby={`${s.id}-h`}>
              <div className="txt">
                <h2 id={`${s.id}-h`}>{s.title}</h2>
                {s.body.map((b) => <p key={b}>{b}</p>)}
              </div>
              {p && (p.position
                ? <BucketPhoto src={p.url} width={2400} height={1600} alt={p.alt} position={p.position} sizes="(min-width: 1000px) 40vw, 100vw" className="ph local" />
                : <Photo src={p.url} alt={p.alt} width={900} height={1100} sizes="(min-width: 1000px) 40vw, 100vw" mobile={{ width: 800, height: 600 }} className="ph" />)}
            </section>
          );
        })}
      </div>

      {dev.address.lat != null && dev.address.lng != null && (
        <section className="wrap map-sec" id="plan" aria-labelledby="plan-h">
          <div className="map-head">
            <h2 id="plan-h">Plan de situation</h2>
            <p className="muted">{addr}</p>
          </div>
          <StaticMap lat={dev.address.lat} lng={dev.address.lng} zoom={14} label={`${dev.title}, ${addr}`} cols={6} rows={4} />
        </section>
      )}

      <ContactBand site={site} heading="Visiter le terrain et l’espace de vente" />
    </Layout>
  );
}
