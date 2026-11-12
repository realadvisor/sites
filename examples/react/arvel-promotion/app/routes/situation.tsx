// Location: the neighbourhood (site content), the address on a static map,
// straight-line distances computed from the coordinates, and place photos.
import type { Route } from './+types/situation';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { Hero } from '../components/Hero';
import { StaticMap } from '../components/StaticMap';
import { EnquiryBlock } from '../components/EnquiryBlock';
import { Photo } from '../components/Photo';
import { sites } from '../lib/data.server';
import { contentFor, crowFlies, placePhotos } from '../content/programmes';
import { addressLine } from '../lib/fr';
import { ogImage } from '../lib/seo';
import './situation.css';

export async function loader({ params }: Route.LoaderArgs) {
  const d = await sites.development(params.slug);
  if (!d) throw notFound();
  return { d };
}

const km = (v: number) => (v < 1 ? `${Math.round(v * 10) * 100} m` : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v)} km`);

export default function Situation({ loaderData: { d } }: Route.ComponentProps) {
  const c = contentFor(d.slug);
  const photos = placePhotos(c);
  const hero = photos[0] ?? d.photos[0]?.url;
  const placeName = c.placeName ?? d.address.city ?? '';
  const photosOf = c.placePhotosOf ?? placeName;
  const distances = (c.landmarks ?? [])
    .map((l) => ({ name: l.name, km: crowFlies(d.address, l) }))
    .filter((l): l is { name: string; km: number } => l.km != null)
    .sort((a, b) => a.km - b.km);
  const address = addressLine(d.address);
  return (
    <Layout
      title={`Situation · ${d.title}, ${d.address.city ?? ''} | Arvel Promotion`}
      description={`${d.title}, ${address}. Le quartier, le plan et les distances.`}
      image={ogImage(hero)}
      programme={d}
      section="situation"
      current="programmes"
      hero={<Hero size="band" photo={hero} alt={photosOf} kicker={d.title} title="Situation" line={placeName} />}
    >
      <section className="section" aria-labelledby="h-q">
        <div className="wrap st-grid">
          <div className="st-text">
            <h2 id="h-q" className="display">Le quartier</h2>
            {c.situation?.map((p, i) => <p key={i} className={i === 0 ? 'lead' : 'muted'}>{p}</p>)}
            {address && <p className="st-addr"><span className="st-lbl">Adresse</span>{address}</p>}
          </div>
          {d.address.lat != null && d.address.lng != null && (
            <div className="reveal"><StaticMap lat={d.address.lat} lng={d.address.lng} label={d.title} /></div>
          )}
        </div>
      </section>

      {distances.length > 0 && (
        <section className="section section--tight section--deep" aria-labelledby="h-dist">
          <div className="wrap">
            <div className="st-dhead">
              <h2 id="h-dist" className="h3">À proximité</h2>
              <p className="muted">Distances à vol d’oiseau, calculées depuis l’adresse de la résidence.</p>
            </div>
            <ol className="st-dist">
              {distances.map((l) => (
                <li key={l.name} className="reveal"><span className="st-km num">{km(l.km)}</span><span className="st-nm">{l.name}</span></li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {photos.length > 1 && (
        <section className="section" aria-labelledby="h-ph">
          <div className="wrap">
            <h2 id="h-ph" className="h3 st-ph-h">{photosOf} en images</h2>
            <ul className="st-places">
              {photos.slice(1, 7).map((p, i) => (
                <li key={i} className={`frame settle st-p${i}`}><Photo src={p} alt={`${photosOf}, photo ${i + 1}`} width={i === 0 ? 1200 : 720} height={i === 0 ? 800 : 480} sizes={i === 0 ? '(min-width: 900px) 66vw, 100vw' : '(min-width: 900px) 33vw, 50vw'} /></li>
              ))}
            </ul>
            <p className="muted st-credit">{c.placePhotosOf ? `Photos d’ambiance de ${c.placePhotosOf}, à proximité.` : 'Photos d’ambiance de la ville.'}</p>
          </div>
        </section>
      )}

      <EnquiryBlock programme={d} />
    </Layout>
  );
}
