// Lage: Tössfeld and Winterthur as written content (transport, schools,
// shops, leisure), distances computed from the address coordinates
// (lib/place.ts), the static map and place photos (bucket, Pexels: see
// app/content/photo-credits.md).
import type { Route } from './+types/lage';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { BucketPicture } from '../components/BucketPicture';
import { StaticMap } from '../components/StaticMap';
import { Icon } from '../components/Icon';
import { site as load } from '../lib/data.server';
import { distances, METHOD_NOTE } from '../lib/place';
import './lage.css';

const GROUPS = [
  { key: 'verkehr', title: 'Unterwegs' },
  { key: 'alltag', title: 'Alltag' },
  { key: 'freizeit', title: 'Freizeit' },
] as const;
const PHOTOS = [
  { name: 'pexels-25906507', alt: 'Gasse in der Winterthurer Altstadt mit Tischen im Freien', caption: 'Altstadt Winterthur' },
  { name: 'pexels-958430', alt: 'Waldweg bei Winterthur im Gegenlicht', caption: 'Wald bei Winterthur' },
  { name: 'pexels-25906437', alt: 'Strassenecke in Winterthur mit Altbauten und Fahrleitungen', caption: 'Winterthur, Strassenecke' },
];
const walk = (d?: { minutes?: number }) => (d?.minutes ? `, zu Fuss etwa ${d.minutes} Min.` : '');

export async function loader() {
  const { dev } = await load();
  const near = distances(dev.address);
  const at = (label: string) => near.find((d) => d.label === label);
  const bus = at('Bushaltestelle Gaswerk');
  const station = at('Bahnhof Winterthur-Töss');
  const hb = at('Winterthur Hauptbahnhof');
  return {
    meta: {
      title: `Lage: ${dev.address.city ?? ''}-Tössfeld, bei der Lokstadt | ${dev.title}`,
      description: `${dev.title} liegt im Tössfeld in ${dev.address.city ?? ''}: Bushaltestelle${bus ? ` ${bus.distance}` : ''}, Bahnhof Winterthur-Töss${station ? ` ${station.distance}` : ''} und Hauptbahnhof${hb ? ` ${hb.distance}` : ''} Luftlinie, Schule, Läden und die Lokstadt in der Nähe.`,
    },
    title: dev.title,
    address: dev.address,
    near,
    bus,
    station,
    hb,
    lok: at('Lokstadt, Dialogplatz'),
    river: at('Ufer der Töss'),
    oldTown: at('Altstadt, Marktgasse'),
    place: [dev.address.street, [dev.address.postcode, dev.address.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
  };
}

export default function Lage({ loaderData: d }: Route.ComponentProps) {
  const { near, bus, station, hb, lok, river, oldTown, address } = d;
  return (
    <Layout page="lage" {...d.meta}>
      <PageHead title="Lage" eyebrow={d.place} lead={`Das Quartier Zinnober liegt im Tössfeld, südwestlich der Winterthurer Innenstadt: zwischen der Lokstadt auf dem früheren Sulzer-Areal und dem Fluss Töss${hb ? `, ${hb.distance} Luftlinie vom Hauptbahnhof` : ''}.`} tone="lilac">
        <figure className="head-pic">
          <BucketPicture name="pexels-25906487" alt="Gasse in der Altstadt von Winterthur mit Cafés und historischen Häusern" ratio={3 / 2} position="50% 66%" sizes="(min-width: 1000px) 460px, 100vw" priority />
          <figcaption>Altstadt Winterthur</figcaption>
        </figure>
      </PageHead>

      <section className="wrap map-row">
        {address.lat != null && address.lng != null && <StaticMap lat={address.lat} lng={address.lng} label={d.title} zoom={16} cols={7} rows={4} className="big-map" />}
        <div className="dist-wrap">
          <ul className="dist" aria-label="Distanzen ab der Adresse, Luftlinie">
            {near.map((n) => (
              <li key={n.label}>
                <Icon name={n.icon} size={24} />
                <span>{n.label}{n.minutes != null && <small>zu Fuss etwa {n.minutes} Min.</small>}</span>
                <strong className="num">{n.distance}</strong>
              </li>
            ))}
          </ul>
          <p className="note">{METHOD_NOTE}</p>
        </div>
      </section>

      <section className="band text-band">
        <div className="wrap text-grid">
          <article className="txt">
            <h2>Tössfeld</h2>
            <p>Das Tössfeld war lange von der Industrie geprägt. Auf dem früheren Sulzer-Areal ist die Lokstadt entstanden, mit Wohnungen, Läden und Plätzen; der Dialogplatz liegt {lok?.distance ?? ''} Luftlinie vom Quartier Zinnober. Die Bushaltestelle Gaswerk liegt {bus?.distance ?? ''} entfernt, der Bahnhof Winterthur-Töss ist {station?.distance ?? ''} entfernt{walk(station) || '.'}</p>
          </article>
          <article className="txt">
            <h2>Winterthur</h2>
            <p>Winterthur ist die sechstgrösste Stadt der Schweiz: eine Altstadt mit Gassen und Plätzen{oldTown ? ` (${oldTown.distance} Luftlinie)` : ''}, mehrere Kunstmuseen, Parks und Wälder am Stadtrand. Ab dem Hauptbahnhof{hb ? `, ${hb.distance} vom Quartier,` : ''} fahren Züge direkt nach Zürich und zum Flughafen.</p>
          </article>
          {GROUPS.map((g) => (
            <article className={`txt card card--${g.key}`} key={g.key}>
              <h2>{g.title}</h2>
              {g.key === 'verkehr' && <p>Bus ab der Haltestelle Gaswerk, S-Bahn ab Bahnhof Winterthur-Töss, Fernverkehr ab Hauptbahnhof. Im Hof gibt es eine Velohalle, Autoabstellplätze in der Tiefgarage.</p>}
              {g.key === 'alltag' && <p>Kindergarten, Schule und ein Supermarkt liegen im Tössfeld, alle in wenigen hundert Metern.</p>}
              {g.key === 'freizeit' && <p>Im Hof: Spielplatz und Gemeinschaftsgärten. Um die Ecke: die Tössfeld-Anlage und die Plätze der Lokstadt, weiter südwestlich das Ufer der Töss{river ? ` (${river.distance})` : ''}.</p>}
              <ul className="mini">
                {near.filter((n) => n.group === g.key).map((n) => <li key={n.label}><span>{n.label}</span><strong className="num">{n.distance}</strong></li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap photos band" aria-labelledby="photos-title">
        <h2 id="photos-title" className="photos-title">Winterthur</h2>
        <div className="photo-grid">
          {PHOTOS.map((p, i) => (
            <figure className={`ph ph-${i}`} key={p.name}>
              <BucketPicture name={p.name} alt={p.alt} ratio={i === 0 ? 4 / 5 : 4 / 3} sizes={i === 0 ? '(min-width: 900px) 40vw, 100vw' : '(min-width: 900px) 30vw, 100vw'} />
              <figcaption>{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="band band--zinnober cta-band">
        <div className="wrap cta-in">
          <h2>Musterwohnung besichtigen</h2>
          <p className="lead">Die Musterwohnung im Quartier kann nach Vereinbarung besichtigt werden. Schreiben Sie uns, welche Wohnung Sie interessiert.</p>
          <a className="cta" href="/kontakt">Termin anfragen <Icon name="arrow" /></a>
        </div>
      </section>
    </Layout>
  );
}
