/** Home: framed hero, the figures a buyer needs, the project, availability by type beside the drawing, the place, the sales office. */
import type { Route } from './+types/home';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { IsoDrawing } from '../components/IsoDrawing';
import { AgentCard } from '../components/AgentCard';
import { loadSite } from '../lib/data.server';
import { developmentExtra } from '../lib/extras';
import { href, langOf, tel } from '../lib/routes';
import { c } from '../lib/copy';
import { brochure } from '../lib/docs';
import { deliveryLabel, formatAmount, formatRooms, planSrc, planKey, range, unitTypes } from '../lib/units';
import { DESCRIPTION_DE } from '../content/project';
import { photoAlt } from '../content/photo-alts';
import { crowKm, km, PHOTOS, PLACES } from '../content/place';
import './home.css';

export async function loader({ request }: Route.LoaderArgs) {
  return { l: langOf(new URL(request.url).pathname), site: await loadSite(request) };
}

export default function Home({ loaderData: { l, site } }: Route.ComponentProps) {
  const { dev, team, org } = site;
  const units = dev.units;
  const available = units.filter((u) => u.status === 'available');
  const rooms = range(units.flatMap((u) => (u.rooms != null ? [u.rooms] : [])));
  const surf = range(units.flatMap((u) => (u.living_surface ? [u.living_surface] : [])));
  const prices = available.flatMap((u) => (u.price && !u.price_on_request ? [u.price] : []));
  const delivery = deliveryLabel(dev, l);
  const types = unitTypes(units);
  const extra = developmentExtra(dev); // fixture only: buildings
  const houses = (extra.buildings ?? []).length;
  const photos = dev.photos;
  const hero = photos[0];
  const pdf = brochure(l);
  const dash = ' – ';
  const where = dev.address.lat != null && dev.address.lng != null ? { lat: dev.address.lat, lng: dev.address.lng } : null;
  const near = where ? PLACES.slice(0, 3).map((p) => ({ name: p.name[l], d: km(crowKm(where, p), l) })) : [];

  const T = {
    it: {
      title: `${dev.title}, appartamenti nuovi a Castagnola, Lugano`,
      lead: `${units.length} appartamenti${houses ? ` in ${houses === 2 ? 'due' : houses} palazzine` : ''} sul pendio di Castagnola, sopra il lago di Lugano.`,
      seeUnits: 'Vedi gli appartamenti',
      projectH: 'Sul pendio, davanti al lago',
      availH: 'Disponibilità per tipologia',
      availP: 'Ogni segmento del disegno è un appartamento. Passa sopra o clicca per aprirlo.',
      allUnits: `Tutti i ${units.length} appartamenti`,
      outdoorLine: 'Ogni appartamento ha il suo spazio esterno: giardino al piano terra, loggia ai piani, terrazza negli attici.',
      placeH: 'Castagnola, Lugano',
      placeP: 'Un quartiere residenziale sul versante del Monte Brè, tra Cassarate e Gandria. Il centro di Lugano è a dieci minuti, il sentiero dell’olivo verso Gandria parte poco sotto la residenza.',
      crow: 'in linea d’aria',
      morePlace: 'La posizione',
      salesH: 'Visite e informazioni',
      salesP: 'Le visite del cantiere e dell’ufficio vendite si fissano su appuntamento.',
      none: 'nessuno disponibile',
      figAv: 'disponibili',
      figUnits: `su ${units.length}`,
    },
    de: {
      title: `${dev.title}, Neubauwohnungen in Castagnola, Lugano`,
      lead: `${units.length} Wohnungen${houses ? ` in ${houses === 2 ? 'zwei' : houses} kleinen Häusern` : ''} am Hang von Castagnola, über dem Luganersee.`,
      seeUnits: 'Wohnungen ansehen',
      projectH: 'Am Hang, vor dem See',
      availH: 'Verfügbarkeit nach Wohnungstyp',
      availP: 'Jedes Feld der Zeichnung ist eine Wohnung. Darüberfahren oder anklicken, um sie zu öffnen.',
      allUnits: `Alle ${units.length} Wohnungen`,
      outdoorLine: 'Jede Wohnung hat ihren Aussenraum: Garten im Erdgeschoss, Loggia in den Obergeschossen, Terrasse in der Attika.',
      placeH: 'Castagnola, Lugano',
      placeP: 'Ein Wohnquartier am Hang des Monte Brè, zwischen Cassarate und Gandria. Das Zentrum von Lugano ist zehn Minuten entfernt, der Olivenweg nach Gandria beginnt knapp unterhalb der Residenz.',
      crow: 'Luftlinie',
      morePlace: 'Zur Lage',
      salesH: 'Besichtigung und Beratung',
      salesP: 'Besichtigungen der Baustelle und des Verkaufsbüros nach Vereinbarung.',
      none: 'keine verfügbar',
      figAv: 'verfügbar',
      figUnits: `von ${units.length}`,
    },
  }[l];
  type Type = (typeof types)[number];
  const typeName = (t: Type) => (t.penthouse ? `${c('penthouse', l)} ${formatRooms(t.rooms, l)}` : formatRooms(t.rooms, l));
  const typeHref = (t: Type) => `${href('units', l)}?rooms=${t.rooms}${t.penthouse ? '&floor=top' : ''}`;
  const sample = (t: Type) => planSrc(planKey(t.available[0] ?? t.units[0]!, units), l, true);
  const description = l === 'it' ? null : DESCRIPTION_DE;

  return (
    <Layout l={l} route="home" scope="v-home" title={T.title} description={T.lead} image={hero ? img(hero.url, { w: 1200, h: 630 }) : undefined}>
      {hero && (
        <section className="hero">
          <div className="frame" data-hero="">
            <Photo src={hero.url} alt={photoAlt(hero.url, l, hero.alt)} width={1600} height={900} sizes="(max-width: 640px) 100vw, calc(100vw - 32px)" priority mobile={{ width: 4, height: 5 }} />
            <div className="hero-text">
              <h1 className="h1">{dev.title}</h1>
              <p className="lede">{T.lead}</p>
              <p className="actions">
                <a className="btn light" href={href('units', l)}>{T.seeUnits}</a>
                {pdf && <a className="btn hero-ghost" href={pdf} download>{c('brochure', l)} (PDF)</a>}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="wrap figures" aria-label={l === 'de' ? 'Eckdaten' : 'In breve'}>
        <dl>
          <div><dt>{T.figAv}</dt><dd><span className="num">{available.length}</span> <small>{T.figUnits}</small></dd></div>
          {rooms && <div><dt>{c('rooms', l)}</dt><dd className="num">{String(rooms.min)}{dash}{String(rooms.max)}</dd></div>}
          {surf && <div><dt>{c('livingArea', l)}</dt><dd className="num">{surf.min}{dash}{surf.max} m²</dd></div>}
          {prices.length > 0 && <div><dt>{c('price', l)}</dt><dd><small>{c('from', l)}</small> <span className="num">{formatAmount(Math.min(...prices))}</span></dd></div>}
          {delivery && <div><dt>{c('deliveryPlanned', l)}</dt><dd>{delivery}</dd></div>}
        </dl>
      </section>

      <section className="wrap section project">
        {photos[1] && (
          <div className="project-photo">
            <Photo className="arch" src={photos[1].url} alt={photoAlt(photos[1].url, l, photos[1].alt)} width={800} height={1040} sizes="(max-width: 860px) 80vw, 34vw" />
          </div>
        )}
        <div className="project-text">
          <h2 className="h2">{T.projectH}</h2>
          {description ? (
            <div className="prose">{description.map((p) => <p key={p}>{p}</p>)}</div>
          ) : (
            dev.description && <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(dev.description) }} />
          )}
          {(dev.architect?.name || dev.developer?.name) && (
            <dl className="credits">
              {dev.architect?.name && <div><dt>{c('architect', l)}</dt><dd>{dev.architect?.name}</dd></div>}
              {dev.developer?.name && <div><dt>{c('developer', l)}</dt><dd>{dev.developer?.name}</dd></div>}
            </dl>
          )}
        </div>
      </section>

      <section className="avail">
        <div className="wrap section avail-grid">
          <div className="avail-head">
            <h2 className="h2">{T.availH}</h2>
            <p className="muted">{T.availP}</p>
          </div>
          <IsoDrawing units={units} l={l} className="avail-drawing" />
          <ul className="types">
            {types.map((t) => (
              <li key={t.key}>
                <a href={typeHref(t)}>
                  {sample(t) && <img className="plan" src={sample(t)!} alt="" width="128" height="96" loading="lazy" decoding="async" />}
                  <span className="t-name">{typeName(t)}</span>
                  {t.surface && <span className="t-surf num">{t.surface.min === t.surface.max ? t.surface.min : `${t.surface.min}${dash}${t.surface.max}`} m²</span>}
                  <span className="t-av">{t.available.length ? `${t.available.length} ${c('available', l)}` : T.none}</span>
                  <span className="t-price num">{t.priceFrom ? `${c('from', l)} ${formatAmount(t.priceFrom)}` : ''}</span>
                  <svg className="arrow" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
                </a>
              </li>
            ))}
          </ul>
          <p className="avail-all"><a className="btn" href={href('units', l)}>{T.allUnits}</a></p>
        </div>
      </section>

      {photos[2] && (
        <section className="bleed">
          <Photo src={photos[2].url} alt={photoAlt(photos[2].url, l, photos[2].alt)} width={1920} height={820} sizes="100vw" mobile={{ width: 4, height: 5 }} />
          <p className="bleed-line wrap">{T.outdoorLine}</p>
        </section>
      )}

      <section className="wrap section place">
        <div className="place-text">
          <h2 className="h2">{T.placeH}</h2>
          <p className="lede">{T.placeP}</p>
          {near.length > 0 && (
            <ul className="near">
              {near.map((n) => <li key={n.name}><span>{n.name}</span><span className="num">{n.d}</span></li>)}
            </ul>
          )}
          {near.length > 0 && <p className="muted small">{T.crow}</p>}
          <p><a className="link" href={href('location', l)}>{T.morePlace}</a></p>
        </div>
        <Photo className="place-photo" src={PHOTOS.fromBre.url} alt={PHOTOS.fromBre.alt[l]} width={1100} height={800} sizes="(max-width: 860px) 100vw, 55vw" />
      </section>

      <section className="sales">
        <div className="wrap section sales-grid">
          <div>
            <h2 className="h2">{T.salesH}</h2>
            <p className="lede">{T.salesP}</p>
            <p className="actions"><a className="btn" href={href('contact', l)}>{c('writeUs', l)}</a></p>
          </div>
          <div className="sales-people">
            {site.agent && <AgentCard agent={site.agent} l={l} />}
            <div className="office">
              <p className="o-name">{team?.name ?? org.name}</p>
              {team?.address && <p className="muted">{team.address.street}, {team.address.postcode} {team.address.city}</p>}
              {team?.phone && <p><a href={tel(team.phone)} className="num">{team.phone}</a></p>}
              {team?.email && <p><a href={`mailto:${team.email}`}>{team.email}</a></p>}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
