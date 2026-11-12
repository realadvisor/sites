// One unit: plan first, then its figures and facts, its place in the
// building, photos when it is a live listing, and the enquiry with this
// unit preselected. Sold units stay reachable (noindex) and say so.
import { Fragment } from 'react';
import type { Route } from './+types/lot';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { featureLabel } from '@realadvisor/sites-kit/i18n';
import { LOCALE } from '@realadvisor/sites-kit/format';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { FloorPlan } from '../components/FloorPlan';
import { StackingPlan } from '../components/StackingPlan';
import { EnquiryBlock } from '../components/EnquiryBlock';
import { Photo } from '../components/Photo';
import { sites, unitExtras } from '../lib/data.server';
import { orientationCode } from '../lib/units';
import { documentsFor, formatBytes } from '../content/documents';
import {
  bedroomsText, deliveryText, floorName, formatSurface, orientationLabel, plural, programmeUrl, roomsText, statusLabel, typeCode, typeName,
  unitIdFromPath, unitLabel, unitPrice, unitUrl,
} from '../lib/fr';
import { ogImage } from '../lib/seo';
import './lot.css';

export async function loader({ params }: Route.LoaderArgs) {
  const d = await sites.development(params.slug);
  const id = unitIdFromPath(params.lot ?? '');
  const u = d && id ? d.units.find((x) => x.id === id) : undefined;
  if (!d || !u) throw notFound();
  return { d, u, extras: unitExtras(d) };
}

export default function Lot({ loaderData: { d, u, extras } }: Route.ComponentProps) {
  const terrace = u.terrace_surface;
  const outdoor = terrace ?? u.balcony_surface;
  const facts = [
    { label: 'Type', value: `${typeCode(u)} · ${typeName(u)}` },
    { label: 'Étage', value: floorName(u) },
    { label: 'Surface habitable', value: u.living_surface ? formatSurface(u.living_surface) : '' },
    { label: terrace ? 'Terrasse' : 'Balcon', value: outdoor ? formatSurface(outdoor) : '' },
    { label: 'Pièces', value: roomsText(u) },
    { label: 'Chambres', value: bedroomsText(u) },
    { label: 'Salles de bains', value: u.bathrooms ? String(u.bathrooms) : '' },
    { label: 'Orientation', value: orientationLabel(orientationCode(u)) },
    { label: d.status === 'delivered' ? 'Livraison' : 'Livraison prévue', value: deliveryText(d).replace(/^Livraison |^Livré en /, '') },
  ].filter((f) => f.value);
  const photos = u.photos ?? [];
  const sameType = d.units.filter((o) => o.id !== u.id && o.status === 'available' && typeCode(o) === typeCode(u)).slice(0, 4);
  const docs = documentsFor(d.slug).filter((doc) => doc.kind !== 'brochure');
  const label = unitLabel(u);
  const title = `${typeCode(u)} ${typeName(u).toLowerCase()}${u.living_surface ? ` de ${u.living_surface} m²` : ''}, ${floorName(u).toLowerCase()} · ${d.title}`;
  const price = unitPrice(u);
  return (
    <Layout
      title={`${title} | ${u.status === 'available' ? price : statusLabel(u)}`}
      description={`${label} à ${d.address.city ?? ''}, ${d.title}${outdoor ? `, ${terrace ? 'terrasse' : 'balcon'} de ${outdoor} m²` : ''}. ${u.status === 'available' ? price : statusLabel(u)}. Plan, surfaces et demande d’information.`}
      image={ogImage(photos[0]?.url ?? d.photos[0]?.url)}
      programme={d}
      section="units"
      current="programmes"
      noindex={u.status === 'sold'}
    >
      <section className="lot section section--tight">
        <div className="wrap">
          <nav className="lt-crumbs" aria-label="Fil d’Ariane">
            <a href={programmeUrl(d)}>{d.title}</a><span aria-hidden="true">/</span><a href={programmeUrl(d, 'logements')}>Logements</a><span aria-hidden="true">/</span><span aria-current="page">{typeCode(u)} · {floorName(u)}</span>
          </nav>
          <div className="lt-grid">
            <figure className="lt-plan paper">
              <FloorPlan unit={u} orientation={orientationCode(u)} terrace={terrace} />
              <figcaption>Plan indicatif, non contractuel. Surfaces des pièces indicatives, calculées sur la surface habitable du logement.</figcaption>
            </figure>
            <div className="lt-info">
              <p className="lt-kicker">{d.title}, {d.address.city}</p>
              <h1 className="lt-h1">
                <span className="lt-code">{typeCode(u)}</span>
                <span className="lt-where">{typeName(u)}, {floorName(u).toLowerCase()}</span>
              </h1>
              {u.reference && <p className="lt-ref num">Lot {u.reference}</p>}
              <div className="lt-big">
                {u.living_surface && <div><span className="lt-v num">{u.living_surface}</span><span className="lt-u">m² habitables</span></div>}
                {outdoor && <div><span className="lt-v num">{outdoor}</span><span className="lt-u">m² de {terrace ? 'terrasse' : 'balcon'}</span></div>}
              </div>
              <p className="lt-price">
                {u.status === 'available' ? <span className="num">{price}</span> : <span className="pill" data-st={u.status}>{statusLabel(u)}</span>}
              </p>
              {u.status === 'sold' && <p className="muted lt-soldnote">Ce logement est vendu. Les logements encore disponibles de {d.title} sont sur le plan de la résidence ci-dessous.</p>}
              {u.status === 'reserved' && <p className="muted lt-soldnote">Ce logement fait l’objet d’une réservation. Laissez vos coordonnées : nous vous prévenons s’il redevient disponible.</p>}
              <dl className="lt-facts">
                {facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
              </dl>
              {u.features.length > 0 && (
                <ul className="lt-features" aria-label="Équipements">
                  {u.features.map((k) => <li key={k}>{featureLabel(k, LOCALE)}</li>)}
                </ul>
              )}
              <div className="lt-actions">
                {u.status !== 'sold' && <a className="button button--solid" href="#contact">Se renseigner sur ce logement</a>}
                {docs.map((doc) => <a key={doc.href} className="link" href={doc.href} download>{doc.title} <span className="muted">(PDF, {formatBytes(doc.bytes)})</span></a>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {u.description && (
        <section className="section section--tight lt-desc-s">
          <div className="wrap lt-desc-grid">
            <h2 className="h3">Le logement</h2>
            <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(u.description) }} />
          </div>
        </section>
      )}

      {photos.length > 0 && (
        <section className="section section--tight lt-photos-s" aria-labelledby="h-photos">
          <div className="wrap">
            <h2 id="h-photos" className="h3">Photos</h2>
            <ul className="lt-photos">
              {photos.slice(0, 5).map((p, i) => (
                <li key={i} className={i === 0 ? 'frame lt-wide' : 'frame'}>
                  <Photo src={p} alt={p.alt || `${label}, photo ${i + 1}`} width={i === 0 ? 1200 : 720} height={i === 0 ? 800 : 540} sizes={i === 0 ? '(min-width: 900px) 66vw, 100vw' : '(min-width: 900px) 33vw, 50vw'} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section section--tight section--deep" aria-labelledby="h-where">
        <div className="wrap">
          <div className="lt-where-head">
            <h2 id="h-where" className="h3">Sa place dans la résidence</h2>
            {sameType.length > 0 && (
              <p className="muted">Autres {typeCode(u)} disponibles : {sameType.map((o, i) => <Fragment key={o.id}>{i > 0 && ', '}<a href={unitUrl(d, o)}>{floorName(o).toLowerCase()}</a></Fragment>)}</p>
            )}
          </div>
          <StackingPlan programme={d} extras={extras} compact current={u.id} labelledby="h-where" />
          <p className="lt-more"><a className="link" href={programmeUrl(d, 'logements')}>{plural(d.stats.available, 'logement disponible', 'logements disponibles')}</a></p>
        </div>
      </section>

      <EnquiryBlock programme={d} selectedUnit={u.status !== 'sold' ? u.id : undefined} title={u.status === 'sold' ? `Un autre logement de ${d.title} vous intéresse ?` : 'Ce logement vous intéresse ?'} />
    </Layout>
  );
}
