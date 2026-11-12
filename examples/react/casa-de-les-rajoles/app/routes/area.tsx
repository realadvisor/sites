/** The neighbourhood (/barrio, /en/neighbourhood): one aerial, a lead, places with straight-line distances, the map. */
import type { Route } from './+types/area';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { StaticMap } from '../components/StaticMap';
import { loadSite } from '../lib/data.server';
import { alternates, langOfPath, tr } from '../lib/i18n';
import { AERIAL, PLACES, km } from '../content/barrio';
import './area.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const { dev } = await loadSite();
  const here = dev.address.lat != null && dev.address.lng != null ? { lat: dev.address.lat, lng: dev.address.lng } : null;
  const dist = (d: number) => (d < 1 ? `${Math.round(d * 20) * 50} m` : `${new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', { maximumFractionDigits: 1 }).format(d)} km`);
  const places = PLACES.map((p) => ({ ...p, d: here ? km(here, p) : null })).sort((a, b) => (a.d ?? 0) - (b.d ?? 0));
  return {
    lang,
    title: dev.title,
    label: `${dev.title}, ${dev.address.street}, ${dev.address.postcode} ${dev.address.city}`,
    here,
    places: places.map((p, i) => ({ id: p.id, n: i + 1, lat: p.lat, lng: p.lng, photo: p.photo, name: p.name[lang], text: p.text[lang], alt: p.alt?.[lang] ?? p.name[lang], dist: p.d != null ? dist(p.d) : null, near: (p.d ?? 99) < 1.6 })),
  };
}

export default function Area({ loaderData: d }: Route.ComponentProps) {
  const { lang, places } = d;
  const t = tr(lang);
  return (
    <Layout lang={lang} route="area" title={`${t.areaH1} | ${d.title}`} description={t.areaLead} image={img(AERIAL, { w: 1200, h: 630 })} alternates={alternates('area')} page="pg-area">
      <section className="wrap head">
        <h1>{t.areaH1}</h1>
        <p className="lede">{t.areaLead}</p>
      </section>
      <div className="wrap aerial">
        <Photo src={AERIAL} alt={lang === 'es' ? 'Vista aérea del jardín del Turia y la Ciutat de les Arts i les Ciències' : 'Aerial view of the Turia gardens and the City of Arts and Sciences'} width={1600} height={700} priority sizes="(min-width: 1376px) 1280px, 100vw" mobile={{ width: 800, height: 640 }} />
      </div>

      <section className="wrap places" aria-labelledby="d-h">
        <div className="p-head">
          <h2 id="d-h">{t.distTitle}</h2>
          <p className="muted small">{t.distNote}</p>
        </div>
        <ol>
          {places.map((p) => (
            <li key={p.id}>
              <p className="row"><span className="i num">{p.n}</span><b>{p.name}</b>{p.dist != null && <span className="d num">{p.dist}</span>}</p>
              <p className="tx">{p.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="wrap pics" aria-label={lang === 'es' ? 'Fotos del barrio' : 'Photos of the area'}>
        {places.filter((p) => p.photo).map((p, i) => (
          <figure key={p.id} className={`f${i}`}>
            <Photo src={p.photo!} alt={p.alt} width={i === 0 ? 900 : 640} height={i === 0 ? 1000 : 480} sizes={i === 0 ? '(min-width: 900px) 40vw, 100vw' : '(min-width: 900px) 30vw, 50vw'} />
            <figcaption>{p.name}</figcaption>
          </figure>
        ))}
      </section>

      {d.here && (
        <section className="wrap map" aria-labelledby="m-h">
          <h2 id="m-h">{t.mapTitle}</h2>
          <StaticMap lat={d.here.lat} lng={d.here.lng} zoom={15} cols={8} rows={5} lang={lang} label={d.label} marks={places.filter((p) => p.near).map((p) => ({ lat: p.lat, lng: p.lng, n: p.n, name: p.name }))} />
        </section>
      )}
    </Layout>
  );
}
