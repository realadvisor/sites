// One programme: hero, the programme in words and facts, unit mix, the
// building floor by floor, photos, location, documents and the enquiry.
import type { Route } from './+types/programme';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Layout } from '../components/Layout';
import { Hero } from '../components/Hero';
import { TypeStrip } from '../components/TypeStrip';
import { StackingPlan } from '../components/StackingPlan';
import { Collage } from '../components/Collage';
import { EnquiryBlock } from '../components/EnquiryBlock';
import { Photo } from '../components/Photo';
import { developmentExtra, sites, unitExtras } from '../lib/data.server';
import { contentFor, placePhotos } from '../content/programmes';
import { documentsFor, formatBytes } from '../content/documents';
import { addressLine, deliveryShort, deliveryText, plural, priceFrom, programmeStatus, programmeUrl, surfaceRange, typeRange } from '../lib/fr';
import { ogImage } from '../lib/seo';
import './programme.css';

export async function loader({ params, request }: Route.LoaderArgs) {
  const d = await sites.development(params.slug);
  if (!d) throw notFound();
  return {
    d,
    // fixture only: developer, architect, general contractor; unit numbers and order on the floor
    x: developmentExtra(d),
    extras: unitExtras(d),
    lot: new URL(request.url).searchParams.get('lot') ?? undefined,
    url: new URL(programmeUrl(d), siteUrl()).href,
  };
}

export default function Programme({ loaderData: { d, x, extras, lot, url } }: Route.ComponentProps) {
  const c = contentFor(d.slug);
  const hero = d.photos[c.hero ?? 0] ?? d.photos[0];
  const status = programmeStatus(d);
  const from = d.stats.available ? priceFrom(d) : '';
  const facts = [
    { label: 'Logements', value: String(d.stats.units) },
    { label: 'Typologies', value: typeRange(d.stats.rooms) },
    { label: 'Surfaces', value: surfaceRange(d.stats.living_surface) },
    { label: d.status === 'delivered' ? 'Livré' : 'Livraison', value: deliveryShort(d) },
    ...(from ? [{ label: 'Prix', value: from }] : []),
  ].filter((f) => f.value);
  const credits = [
    // fixture only: developer, architect, general contractor
    { label: 'Promoteur', value: x.developer },
    { label: 'Architecte', value: x.architect },
    { label: 'Entreprise générale', value: x.general_contractor },
  ].filter((r): r is { label: string; value: string } => !!r.value);
  const rows = [
    { label: 'Adresse', value: addressLine(d.address) },
    { label: 'Statut', value: status },
    { label: d.status === 'delivered' ? 'Livraison' : 'Livraison prévue', value: deliveryText(d).replace(/^Livraison |^Livré en /, '') },
    { label: 'Disponibles', value: d.stats.units ? `${d.stats.available} sur ${d.stats.units}` : '' },
    ...credits,
  ].filter((r) => r.value);
  const others = d.photos.filter((p) => p !== hero);
  const place = placePhotos(c)[0];
  const docs = documentsFor(d.slug);
  const city = d.address.city && !d.title.includes(d.address.city) ? ` à ${d.address.city}` : '';
  const description = `${d.title}${city} : ${[plural(d.stats.units, 'logement neuf', 'logements neufs'), typeRange(d.stats.rooms), deliveryText(d), from].filter(Boolean).join(', ')}.`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: d.title,
    description: d.description_text,
    address: { '@type': 'PostalAddress', streetAddress: d.address.street, postalCode: d.address.postcode, addressLocality: d.address.city, addressCountry: d.address.country },
    numberOfAccommodationUnits: d.stats.units,
    url,
  };
  return (
    <Layout
      title={`${d.title}${city} · Logements neufs | Arvel Promotion`}
      description={description}
      image={ogImage(hero?.url)}
      jsonLd={jsonLd}
      programme={d}
      section="home"
      current="programmes"
      hero={<Hero photo={hero?.url} alt={hero?.alt ?? d.title} tag={{ label: status, status: d.status }} title={d.title} line={addressLine(d.address)} facts={facts} />}
    >
      <section className="section pg-about" aria-labelledby="h-about">
        <div className="wrap pg-grid">
          <div className="reveal">
            <h2 id="h-about" className="sr-only">Le programme</h2>
            {d.description && <div className="prose pg-desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(d.description) }} />}
            <div className="pg-cta-row">
              <a className="button button--solid" href={programmeUrl(d, 'logements')}>Voir les logements</a>
              <a className="link" href="#contact">Être rappelé</a>
            </div>
          </div>
          <dl className="pg-sheet reveal">
            {rows.map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
          </dl>
        </div>
      </section>

      {d.units.length > 0 && d.stats.rooms && (
        <section className="section section--deep" aria-labelledby="h-types">
          <div className="wrap">
            <div className="pg-head">
              <div>
                <h2 id="h-types" className="display">{d.stats.rooms?.min === 1 ? 'Du studio' : `Du T${d.stats.rooms?.min}`} au T{d.stats.rooms?.max}</h2>
              </div>
              <p className="muted pg-note">Plans indicatifs par type de logement. Chaque logement a son propre plan sur sa page.</p>
            </div>
            <TypeStrip programme={d} />
          </div>
        </section>
      )}

      {d.units.length > 0 && (
        <section className="section pg-building" aria-labelledby="h-building">
          <div className="wrap">
            <div className="pg-head">
              <div>
                <h2 id="h-building" className="display">{plural(d.stats.available, 'logement disponible', 'logements disponibles')}, étage par étage</h2>
              </div>
              <ul className="legend" aria-label="Légende">
                <li data-st="available">Disponible</li><li data-st="reserved">Réservé</li><li data-st="sold">Vendu</li>
              </ul>
            </div>
            <StackingPlan programme={d} extras={extras} compact labelledby="h-building" />
            <p className="pg-more"><a className="link" href={programmeUrl(d, 'logements')}>Filtrer par type et voir le tableau</a></p>
          </div>
        </section>
      )}

      {others.length >= 3 && (
        <section className="section section--deep" aria-labelledby="h-gal">
          <div className="wrap">
            <h2 id="h-gal" className="sr-only">Photos</h2>
            <Collage photos={others.slice(0, 3)} fallbackAlt={d.title} />
            <p className="pg-more"><a className="link" href={programmeUrl(d, 'galerie')}>Les {plural(d.photos.length, 'photo', 'photos')}</a></p>
          </div>
        </section>
      )}

      {place && (
        <section className="pg-situ" aria-labelledby="h-situ">
          <div className="pg-situ-media parallax">
            <Photo src={place} alt={c.placePhotosOf ?? c.placeName ?? d.address.city ?? ''} width={1600} height={900} mobile={{ width: 800, height: 800 }} sizes="100vw" />
          </div>
          <div className="wrap pg-situ-body">
            <div className="pg-situ-card reveal">
              <h2 id="h-situ" className="display">{c.placeName ?? d.address.city}</h2>
              {c.situation?.[0] && <p className="lead">{c.situation[0]}</p>}
              <a className="link" href={programmeUrl(d, 'situation')}>Le quartier et les distances</a>
            </div>
          </div>
        </section>
      )}

      {docs.length > 0 && (
        <section className="section section--tight pg-docs" aria-labelledby="h-docs">
          <div className="wrap pg-docs-grid">
            <h2 id="h-docs" className="h3">Documents à télécharger</h2>
            <ul>
              {docs.map((doc) => (
                <li key={doc.href}><a href={doc.href} download><span className="pg-dt">{doc.title}</span><span className="pg-dm num">PDF · {formatBytes(doc.bytes)}</span><span aria-hidden="true" className="pg-dl">↓</span></a></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <EnquiryBlock programme={d} selectedUnit={lot} />
    </Layout>
  );
}
