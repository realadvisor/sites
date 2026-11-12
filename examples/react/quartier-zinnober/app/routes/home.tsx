// Home: the development. Colour-block hero with the three buildings and their
// move-in dates, facts, unit types, photos, location, construction, enquiry.
import type { CSSProperties } from 'react';
import type { Route } from './+types/home';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { BucketPicture } from '../components/BucketPicture';
import { BuildingTiles } from '../components/BuildingTiles';
import { TypeStrip } from '../components/TypeStrip';
import { StaticMap } from '../components/StaticMap';
import { ContactCard } from '../components/ContactCard';
import { Icon } from '../components/Icon';
import { devExtra, rowsOf, site as load } from '../lib/data.server';
import { news } from '../content/news.server';
import { newsMonth } from '../lib/dates';
import { buildings, chf, monthYear, types, unitOptions } from '../lib/units';
import { distances } from '../lib/place';
import './home.css';

export async function loader() {
  const site = await load();
  const { dev } = site;
  const rows = rowsOf(dev);
  const houses = buildings(rows);
  const typeList = types(rows);
  const x = devExtra(dev.id);
  const entries = news(dev.id);
  const done = entries.filter((e) => !e.planned);
  const latest = done.slice(-2).reverse();
  const rents = typeList.map((t) => t.from).filter((n): n is number => n != null);
  const moveIns = houses.map((h) => h.moveIn).filter((d): d is string => !!d).sort();
  const [lead, ...more] = (dev.description ?? '').split('</p>').filter((s) => s.trim()).map((s) => `${s}</p>`);
  const WORDS = ['', 'Ein', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs'];
  const houseWord = WORDS[houses.length] ?? String(houses.length);
  const donePct = entries.length ? Math.round(((done.length - 0.5) / (entries.length - 1)) * 100) : 0;
  const hero = dev.photos[6] ?? dev.photos[0];
  const pics = [dev.photos[8], dev.photos[5], dev.photos[9]].filter((p) => !!p);
  // Location: distances computed from the address coordinates (lib/place.ts).
  const near = distances(dev.address);
  const homeNear = ['Bushaltestelle Gaswerk', 'Bahnhof Winterthur-Töss', 'Schule Tössfeld', 'Lokstadt, Dialogplatz', 'Winterthur Hauptbahnhof']
    .map((l) => near.find((d) => d.label === l))
    .filter((d): d is (typeof near)[number] => !!d);
  const street = dev.address.street?.replace(/\s+\d+\w*$/, '') ?? dev.address.city ?? '';
  const station = near.find((d) => d.label === 'Bahnhof Winterthur-Töss');
  const place = [dev.address.street, [dev.address.postcode, dev.address.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: dev.title,
    description: dev.description_text,
    numberOfAccommodationUnits: dev.stats.units,
    numberOfAvailableAccommodationUnits: dev.stats.available,
    address: { '@type': 'PostalAddress', streetAddress: dev.address.street, postalCode: dev.address.postcode, addressLocality: dev.address.city, addressCountry: 'CH' },
    geo: dev.address.lat != null ? { '@type': 'GeoCoordinates', latitude: dev.address.lat, longitude: dev.address.lng } : undefined,
    image: dev.photos.slice(0, 3).map((p) => img(p.url, { w: 1200, h: 800 })),
    url: siteUrl(),
  };
  return {
    meta: {
      title: `${dev.title}: ${dev.stats.units} Mietwohnungen in ${dev.address.city ?? ''} | Erstvermietung`,
      description: (dev.description_text ?? '').replace(/\s+/g, ' ').slice(0, 155),
      image: hero && img(hero.url, { w: 1200, h: 630 }),
      jsonLd,
    },
    dev: { id: dev.id, title: dev.title, stats: dev.stats, address: dev.address },
    houses,
    typeList,
    x,
    entries,
    latest,
    rents,
    moveIns,
    lead: lead ?? '',
    rest: more.join(''),
    houseWord,
    donePct,
    hero,
    pics,
    homeNear,
    street,
    station,
    place,
    contact: site.contact,
    team: site.team && { name: site.team.name, phone: site.team.phone, email: site.team.email },
    units: unitOptions(rows),
  };
}

export default function Home({ loaderData: d }: Route.ComponentProps) {
  const { dev, houses, pics } = d;
  const sizes = dev.stats.living_surface;
  const roomRange = dev.stats.rooms;
  return (
    <Layout page="home" {...d.meta}>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-grid">
          <div className="hero-text">
            <div className="hero-head">
              <h1 id="hero-title"><span><span className="num">{dev.stats.units}</span> Mietwohnungen</span> <span className="z">im Tössfeld</span></h1>
              <p className="hero-sub">Erstvermietung in {d.houseWord.toLowerCase()} Neubauten am {d.street} in {dev.address.city}{d.station ? `, ${d.station.distance} vom Bahnhof Winterthur-Töss` : ''}.</p>
            </div>
            <dl className="figs">
              {roomRange && <div><dt>Zimmer</dt><dd className="num">{String(roomRange.min)}–{String(roomRange.max)}</dd></div>}
              {sizes && <div><dt>Wohnfläche</dt><dd className="num">{sizes.min}–{sizes.max} m²</dd></div>}
              {d.rents.length > 0 && <div><dt>Miete netto</dt><dd className="num">ab {chf(Math.min(...d.rents))}</dd></div>}
            </dl>
            <div className="hero-cta">
              <a className="cta cta--zinnober" href="/wohnungen">Wohnungen ansehen <Icon name="arrow" /></a>
              <a className="cta cta--outline-light" href="/kontakt">Interesse anmelden</a>
            </div>
          </div>
          <div className="hero-photo" data-hero="">
            {d.hero && <Photo src={d.hero} alt={`${dev.title}, Wohnhaus mit farbigen Loggien`} width={1200} height={900} priority sizes="(min-width: 1100px) 58vw, 100vw" />}
          </div>
        </div>
        <BuildingTiles houses={houses} />
      </section>

      <section className="intro band" aria-labelledby="intro-title">
        <div className="wrap intro-grid">
          <div>
            <h2 id="intro-title" className="intro-title">Neubau am {d.street}</h2>
            {d.lead && <div className="lead-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(d.lead) }} />}
            {d.rest && <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(d.rest) }} />}
          </div>
          <dl className="facts">
            <div><dt>Wohnungen</dt><dd className="num">{dev.stats.units}, davon {dev.stats.available} frei</dd></div>
            {houses.length > 0 && <div><dt>Häuser</dt><dd>{houses.map((h) => h.name).join(', ')}</dd></div>}
            {d.moveIns.length > 0 && <div><dt>Bezug</dt><dd>{[...new Set(d.moveIns.map(monthYear))].join(', ')}</dd></div>}
            {/* fixture only: developer, architect, general contractor */}
            {d.x.developer && <div><dt>Bauherrschaft</dt><dd>{d.x.developer}</dd></div>}
            {d.x.architect && <div><dt>Architektur</dt><dd>{d.x.architect}</dd></div>}
            {d.x.contractor && <div><dt>Totalunternehmung</dt><dd>{d.x.contractor}</dd></div>}
            {d.place && <div><dt>Adresse</dt><dd>{d.place}</dd></div>}
          </dl>
        </div>
      </section>

      <section className="types-band band band--sand" aria-labelledby="types-title">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="types-title" className="sec-title">Vier Wohnungstypen</h2>
            <a className="arrow-link" href="/wohnungen">Zum Stockwerkplan <Icon name="arrow" /></a>
          </div>
          <TypeStrip list={d.typeList} />
        </div>
      </section>

      {pics.length === 3 && (
        <section className="pics band" aria-labelledby="pics-title">
          <div className="wrap">
            <div className="collage">
              <figure className="c1"><Photo src={pics[0]} alt={pics[0]!.alt ?? ''} width={900} height={600} sizes="(min-width: 900px) 50vw, 100vw" /></figure>
              <figure className="c2"><Photo src={pics[1]} alt={pics[1]!.alt ?? ''} width={800} height={600} sizes="(min-width: 900px) 33vw, 100vw" /></figure>
              <figure className="c3"><Photo src={pics[2]} alt={pics[2]!.alt ?? ''} width={900} height={600} sizes="(min-width: 900px) 40vw, 100vw" /></figure>
              <div className="c4">
                <h2 id="pics-title" className="c4-title">Ausbau und Hof</h2>
                <p>Offene Küchen, Parkett, eigener Waschturm in jeder Wohnung. Im Hof: Spielplatz, Gemeinschaftsgärten und Velohalle.</p>
                <a className="arrow-link" href="/galerie">Alle Bilder <Icon name="arrow" /></a>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="place band band--lilac" aria-labelledby="place-title">
        <div className="wrap place-grid">
          <div className="place-text">
            <h2 id="place-title" className="sec-title">Im Tössfeld, zwischen Lokstadt und Töss</h2>
            <ul className="dist">
              {d.homeNear.map((n) => (
                <li key={n.label}><Icon name={n.icon} size={22} /><span>{n.label}</span><strong className="num">{n.distance}</strong></li>
              ))}
            </ul>
            <p className="dist-note">Luftlinie ab {dev.address.street ?? 'der Adresse'}, berechnet aus Koordinaten.</p>
            <a className="arrow-link" href="/lage">Mehr zur Lage <Icon name="arrow" /></a>
          </div>
          {dev.address.lat != null && dev.address.lng != null && <StaticMap lat={dev.address.lat} lng={dev.address.lng} label={dev.title} cols={5} rows={3} />}
        </div>
      </section>

      {d.latest.length > 0 && (
        <section className="build band" aria-labelledby="build-title">
          <div className="wrap">
            <h2 id="build-title" className="sec-title build-title">Stand der Bauarbeiten</h2>
            <ol className="mini-timeline" aria-label="Etappen" style={{ '--done': `${d.donePct}%` } as CSSProperties}>
              {d.entries.map((e) => (
                <li key={e.id} className={e.planned ? 'planned' : undefined}>
                  <span className="dot" aria-hidden="true"></span>
                  <span className="ph">{e.phase}</span>
                  <span className="mo">{newsMonth(e.date)}</span>
                </li>
              ))}
            </ol>
            <div className="news-cards">
              {d.latest.map((e) => (
                <article className="news-card" key={e.id}>
                  {e.photoLocal ? (
                    <BucketPicture name={e.photoLocal} alt={e.photoAlt ?? e.title} ratio={3 / 2} sizes="(min-width: 900px) 40vw, 100vw" />
                  ) : e.photoUrl && <Photo src={e.photoUrl} alt={e.photoAlt ?? e.title} width={800} height={533} sizes="(min-width: 900px) 40vw, 100vw" />}
                  <div>
                    <p className="eyebrow muted"><time dateTime={e.date}>{newsMonth(e.date)}</time></p>
                    <h3><a href={`/news#${e.id}`}>{e.title}</a></h3>
                  </div>
                </article>
              ))}
            </div>
            <a className="arrow-link build-more" href="/news">Alle Etappen <Icon name="arrow" /></a>
          </div>
        </section>
      )}

      <section className="ask band band--zinnober" id="interesse" aria-labelledby="ask-title">
        <div className="wrap ask-grid">
          <div className="ask-text">
            <h2 id="ask-title" className="ask-title">Wohnung anfragen</h2>
            <p className="lead">Wählen Sie eine Wohnung und schreiben Sie uns. Wir melden uns mit den Bewerbungsunterlagen und einem Termin für die Besichtigung der Musterwohnung.</p>
            {d.contact && <ContactCard agent={d.contact} team={d.team} />}
          </div>
          <div className="form-card">
            <EnquiryForm
              id="interesse-form"
              developmentId={dev.id}
              agentId={d.contact?.id}
              agentName={d.contact?.first_name}
              units={d.units}
              message={`Guten Tag, ich interessiere mich für eine Wohnung im ${dev.title}. Bitte senden Sie mir die Bewerbungsunterlagen.`}
              submitLabel="Interesse senden"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}
