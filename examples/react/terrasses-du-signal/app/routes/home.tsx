// Home: hero with the key facts, key figures from the units, the project,
// the unit types, the building, a gallery collage, the place.
import type { Route } from './+types/home';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { StackingPlan } from '../components/StackingPlan';
import { TypeStrip } from '../components/TypeStrip';
import { ContactBand } from '../components/ContactBand';
import { Arrow } from '../components/Arrow';
import { legalAgency, loadSite } from '../lib/data.server';
import { keyFigures, unitTypes } from '../lib/units';
import { PLACES, crowKm, LAUSANNE_STATION } from '../content/place';
import './home.css';

export async function loader() {
  const site = await loadSite();
  const { dev, devExtra: extra } = site;
  return {
    site,
    k: keyFigures(dev),
    types: unitTypes(dev.units),
    jsonLd: agencyJsonLd(legalAgency(site), new URL('/', siteUrl()).href),
    credits: (
      [
        ['Maître d’ouvrage', extra.developer],
        ['Architecte', extra.architect],
        ['Entreprise générale', extra.general_contractor],
      ] as [string, string | undefined][]
    ).filter((c): c is [string, string] => !!c[1]),
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { site, k, types, jsonLd, credits } = loaderData;
  const { dev } = site;
  const [hero, ...rest] = dev.photos;
  const collage = rest.slice(0, 5);
  const intro = rest.slice(5, 7);
  const place = [dev.address.city, 'Lavaux'].filter(Boolean).join(' · ');
  const figures = [
    { v: `${k.available}/${k.units}`, l: k.available > 1 ? 'appartements disponibles' : 'appartement disponible', s: '', text: false },
    { v: k.rooms, l: k.roomsUnit, s: '', text: false },
    { v: k.surfaces, l: 'm² habitables', s: '', text: false },
    { v: k.delivery, l: 'livraison prévue', s: '', text: true },
  ].filter((f) => f.v);
  const description = (dev.description_text ?? dev.title).replace(/\s+/g, ' ').slice(0, 155);
  const { lat, lng } = dev.address;
  const km = lat != null && lng != null ? crowKm({ lat, lng }, LAUSANNE_STATION) : null;
  const count = (s: string) => dev.units.filter((u) => u.status === s).length;
  return (
    <Layout
      overlay
      title={`${dev.title}, appartements neufs à ${dev.address.city ?? ''} | ${site.org.name}`}
      description={description}
      image={hero && img(hero.url, { w: 1200, h: 630 })}
      jsonLd={jsonLd}
    >
      <section className="hero" data-hero="">
        {hero && (
          <Photo src={hero} alt={hero.alt || dev.title} width={1600} height={1000} priority sizes="100vw" mobile={{ width: 800, height: 1000 }} className="hero-img" />
        )}
        <div className="scrim" aria-hidden="true"></div>
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="eyebrow plain" data-rise="">{place}</p>
            <h1 data-rise="2">{dev.title}</h1>
            <p className="kicker" data-rise="3"><em>Appartements neufs face au Léman</em></p>
            <p className="hero-meta num" data-rise="3">
              {k.delivery && <span>Livraison {k.delivery}</span>}
              {k.priceFrom && <span>Dès {k.priceFrom}</span>}
            </p>
            <p className="hero-actions" data-rise="3">
              <a className="cta" href="/contact?demande=brochure">Recevoir la brochure</a>
              <a className="cta ghost" href="/appartements">Voir les appartements</a>
            </p>
          </div>
        </div>
      </section>

      <section className="figures" aria-label="Le projet en chiffres">
        <dl className="wrap fig-grid">
          {figures.map((f) => (
            <div className="fig" key={f.l}>
              <dt className="sr-only">{f.l}</dt>
              <dd>
                <span className={['v', f.text && 'text'].filter(Boolean).join(' ')}>{f.v}</span>
                <span className="l">{f.s ? `${f.l} ${f.s}` : f.l}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section intro">
        <div className="wrap intro-grid">
          <div className="intro-text">
            <h2>{[dev.address.street, dev.address.city].filter(Boolean).join(', ')}</h2>
            {dev.description && <div className="prose lede" dangerouslySetInnerHTML={{ __html: sanitizeHtml(dev.description) }} />}
            <a className="link" href="/situation">Découvrir la situation <Arrow /></a>
          </div>
          {intro.length > 0 && (
            <div className="intro-photos">
              {intro.map((p, i) => (
                <Photo key={p.url} src={p} alt={p.alt || dev.title} width={i === 0 ? 720 : 560} height={i === 0 ? 900 : 700} sizes="(min-width: 1000px) 28vw, 50vw" className={`ip ip${i}`} />
              ))}
            </div>
          )}
        </div>
      </section>

      {types.length > 0 && (
        <section className="section types" aria-labelledby="types-h">
          <div className="wrap">
            <h2 id="types-h" className="types-h">Appartements de {types[0]!.label.replace(/\s*pièces?$/, '')} à {types[types.length - 1]!.label}</h2>
            <TypeStrip types={types} />
            <a className="link after" href="/appartements">Tous les appartements et leurs prix <Arrow /></a>
          </div>
        </section>
      )}

      <section className="section building" aria-labelledby="b-h">
        <div className="wrap b-grid">
          <div className="b-text">
            <h2 id="b-h">Disponibilités par étage</h2>
            <p className="lede">Cliquez sur un lot pour voir son plan, ses surfaces et son prix.</p>
            <ul className="legend">
              {count('available') > 0 && <li><span className="status available">{count('available')} disponibles</span></li>}
              {count('reserved') > 0 && <li><span className="status reserved">{count('reserved')} réservés</span></li>}
              {count('sold') > 0 && <li><span className="status sold">{count('sold')} vendus</span></li>}
            </ul>
            <a className="button" href="/appartements">Voir les appartements</a>
          </div>
          <StackingPlan units={dev.units} extras={site.extras} compact />
        </div>
      </section>

      {collage.length >= 4 && (
        <section className="section gallery" aria-labelledby="g-h">
          <div className="wrap">
            <h2 id="g-h" className="sr-only">Images du projet</h2>
            <div className="collage">
              {collage.slice(0, 4).map((p, i) => (
                <a key={p.url} href={`/galerie#photo-${i + 2}`} className={`c c${i} zoom`} aria-label={`${p.alt || dev.title}, ouvrir la galerie`}>
                  <Photo src={p} alt="" width={[800, 640, 640, 1200][i]!} height={[1000, 760, 760, 760][i]!} sizes="(min-width: 1000px) 33vw, 50vw" />
                </a>
              ))}
            </div>
            <p className="g-foot"><span className="muted">Visualisations non contractuelles.</span> <a className="link" href="/galerie">Les {dev.photos.length} images du projet <Arrow /></a></p>
          </div>
        </section>
      )}

      <section className="place" aria-labelledby="p-h">
        <Photo src={PLACES.hero.url} alt={PLACES.hero.alt} width={1600} height={900} sizes="100vw" mobile={{ width: 800, height: 1000 }} className="place-img" />
        <div className="place-scrim" aria-hidden="true"></div>
        <div className="wrap place-inner">
          <h2 id="p-h">{dev.address.city}, à l’entrée du vignoble de Lavaux</h2>
          <p>Gare CFF de {dev.address.city} sur la ligne Lausanne–Vevey.{km != null && ` Gare de Lausanne à ${String(Math.round(km * 2) / 2).replace('.', ',')} km à vol d’oiseau.`}</p>
          <a className="button light" href="/situation">La situation</a>
        </div>
      </section>

      {credits.length > 0 && (
        <section className="credits" aria-label="Intervenants">
          <dl className="wrap cr-grid">
            {credits.map(([k2, v]) => <div key={k2}><dt>{k2}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>
      )}

      <ContactBand site={site} />
    </Layout>
  );
}
