/** Location: the lake and the hill, a static map with distances computed from the coordinates, then the quarter, the lake and the city. */
import type { Route } from './+types/location';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { StaticMap } from '../components/StaticMap';
import { loadSite } from '../lib/data.server';
import { href, langOf } from '../lib/routes';
import { c } from '../lib/copy';
import { crowKm, km, PHOTOS, PLACES, SECTIONS } from '../content/place';
import './location.css';

export async function loader({ request }: Route.LoaderArgs) {
  return { l: langOf(new URL(request.url).pathname), site: await loadSite(request) };
}

export default function Location({ loaderData: { l, site } }: Route.ComponentProps) {
  const { dev } = site;
  const a = dev.address;
  const where = a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : null;
  const T = {
    it: {
      title: `Posizione: Castagnola, Lugano | ${dev.title}`,
      h1: 'Castagnola, sopra il lago',
      intro: `${dev.title} sorge in ${a.street ?? 'Castagnola'}, sul pendio del Monte Brè, nel quartiere luganese di Castagnola.`,
      dist: 'Distanze in linea d’aria',
      mapNote: 'Coordinate arrotondate: il punto indica la zona, non l’indirizzo esatto.',
      units: 'Vedi gli appartamenti',
    },
    de: {
      title: `Lage: Castagnola, Lugano | ${dev.title}`,
      h1: 'Castagnola, über dem See',
      intro: `${dev.title} liegt an der ${a.street ?? 'Castagnola'}, am Hang des Monte Brè, im Luganeser Quartier Castagnola.`,
      dist: 'Distanzen in Luftlinie',
      mapNote: 'Gerundete Koordinaten: der Punkt zeigt die Gegend, nicht die genaue Adresse.',
      units: 'Wohnungen ansehen',
    },
  }[l];
  return (
    <Layout l={l} route="location" scope="v-location" title={T.title} description={T.intro} image={img(PHOTOS.front.url, { w: 1200, h: 630 })}>
      <section className="hero">
        <div className="frame">
          <Photo src={PHOTOS.front.url} alt={PHOTOS.front.alt[l]} width={1600} height={900} sizes="(max-width: 640px) 100vw, calc(100vw - 32px)" priority mobile={{ width: 4, height: 3 }} />
        </div>
      </section>
      <div className="wrap intro">
        <h1 className="h1">{T.h1}</h1>
        <p className="lede">{T.intro}</p>
      </div>

      {where && (
        <section className="wrap mapgrid" aria-labelledby="dist-h">
          <StaticMap lat={where.lat} lng={where.lng} zoom={14} l={l} label={`${dev.title}, ${a.postcode ?? ''} ${a.city ?? ''}`.trim()} cols={5} rows={3} />
          <div className="dist">
            <h2 id="dist-h" className="h3">{T.dist}</h2>
            <ul>
              {PLACES.map((p) => <li key={p.name.it}><span>{p.name[l]}</span><span className="num">{km(crowKm(where, p), l)}</span></li>)}
            </ul>
            <p className="muted small">{T.mapNote}</p>
          </div>
        </section>
      )}

      {SECTIONS.map((s, i) => (
        <section key={s.id} className={i % 2 === 1 ? 'wrap part flip' : 'wrap part'} id={s.id}>
          <div className="p-photo">
            <Photo className={i === 1 ? 'arch' : 'rounded'} src={s.photo.url} alt={s.photo.alt[l]} width={i === 1 ? 800 : 1200} height={i === 1 ? 1000 : 860} sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
          <div className="p-text">
            <h2 className="h2">{s.title[l]}</h2>
            <div className="prose">{s.body[l].map((p) => <p key={p}>{p}</p>)}</div>
          </div>
        </section>
      ))}

      <section className="wrap closing">
        <Photo className="rounded" src={PHOTOS.salvatore.url} alt={PHOTOS.salvatore.alt[l]} width={1600} height={700} sizes="100vw" mobile={{ width: 4, height: 3 }} />
        <p><a className="btn" href={href('units', l)}>{T.units}</a> <a className="link" href={href('contact', l)}>{c('writeUs', l)}</a></p>
      </section>
    </Layout>
  );
}
