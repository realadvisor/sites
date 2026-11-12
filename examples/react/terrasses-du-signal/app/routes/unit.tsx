// One unit: the plan first, then the facts, its place in the building,
// photos and text when the unit is a live listing, and the enquiry with the
// unit preselected. Unknown unit: 404. Sold: noindex.
import type { Route } from './+types/unit';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { featureLabel } from '@realadvisor/sites-kit/i18n';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { StackingPlan } from '../components/StackingPlan';
import { AgentContact } from '../components/AgentContact';
import { Arrow } from '../components/Arrow';
import { loadSite } from '../lib/data.server';
import {
  deliveryLabel, floorName, formatSurface, orientation, outdoor, planFor, statusLabel, unitFromSlug, unitLabel, unitNumber, unitOptions, unitPath, unitPrice,
} from '../lib/units';
import { tel } from '../lib/nav';
import './unit.css';

export async function loader({ params }: Route.LoaderArgs) {
  const site = await loadSite();
  const unit = unitFromSlug(site.dev, params.slug ?? '');
  if (!unit) throw notFound();
  return { site, unit };
}

export default function UnitPage({ loaderData }: Route.ComponentProps) {
  const { site, unit } = loaderData;
  const { dev, agent, team, extras } = site;
  const no = unitNumber(unit);
  const o = outdoor(unit);
  const plan = planFor(unit, dev.units);
  const ori = orientation(unit);
  const delivery = deliveryLabel(dev);
  const photos = unit.photos ?? [];
  const sold = unit.status === 'sold';
  const roomsTitle = unit.rooms != null ? `${unit.rooms} pièces` : 'Appartement';
  const facts = [
    ['Surface habitable', formatSurface(unit.living_surface)],
    [o?.label ?? '', o ? formatSurface(o.m2) : ''],
    ['Pièces', unit.rooms != null ? String(unit.rooms) : ''],
    ['Chambres', unit.bedrooms != null ? String(unit.bedrooms) : ''],
    ['Salles d’eau', unit.bathrooms != null ? String(unit.bathrooms) : ''],
    ['Étage', floorName(unit)],
    ['Orientation', ori],
    ['Livraison', delivery],
  ].filter(([k, v]) => k && v) as [string, string][];
  const features = unit.features.map((f) => featureLabel(f)).filter(Boolean);
  const similar = dev.units.filter((u) => u.id !== unit.id && u.rooms === unit.rooms && u.status === 'available').slice(0, 3);
  const phone = agent?.phone ?? team?.phone;
  const title = `${roomsTitle}, ${floorName(unit)}${no ? ` (${no})` : ''} | ${dev.title}`;
  const description = [`Appartement de ${roomsTitle}`, formatSurface(unit.living_surface), o && `${o.label.toLowerCase()} de ${formatSurface(o.m2)}`, floorName(unit), `aux ${dev.title.replace(/^Les /, '')}, ${dev.address.city}`, unit.status === 'available' ? unitPrice(unit) : statusLabel(unit)].filter(Boolean).join(', ') + '.';
  const ogPhoto = photos[0] ?? dev.photos[0];
  return (
    <Layout title={title} description={description} image={ogPhoto && img(ogPhoto.url, { w: 1200, h: 630 })} noindex={sold}>
      <div className="wrap">
        <nav className="crumbs" aria-label="Fil d’Ariane">
          <ol>
            <li><a href="/appartements">Appartements</a></li>
            <li aria-current="page">{no || unitLabel(unit)}</li>
          </ol>
        </nav>

        <header className="head">
          <div>
            <p className="eyebrow">{[no, floorName(unit)].filter(Boolean).join(' · ')}</p>
            <h1>{roomsTitle}{o && ` ${o.kind === 'garden' ? 'avec jardin' : 'avec terrasse'}`}</h1>
          </div>
          <div className="head-price">
            <span className={`status ${unit.status}`}>{statusLabel(unit)}</span>
            {unit.status === 'available' && <p className="price num">{unitPrice(unit)}</p>}
          </div>
        </header>

        <div className="main">
          <figure className="plan">
            {plan ? (
              <span className="plan-box"><img src={plan.replace(/\.svg$/, '-fit.svg')} alt={`Plan indicatif de l’appartement de ${roomsTitle}, ${floorName(unit)}`} width="1000" height="750" fetchPriority="high" decoding="async" /></span>
            ) : (
              <div className="no-plan"><p>Plan sur demande</p></div>
            )}
            <figcaption>
              <span>Plan indicatif, non contractuel. Surfaces de vente selon le descriptif.</span>
              <a className="link" href="/documents/plans-terrasses-du-signal.pdf" download>Tous les plans (PDF) <Arrow dir="down" /></a>
            </figcaption>
          </figure>

          <aside className="card" aria-label="Caractéristiques">
            <div className="big">
              {unit.living_surface ? <div><span className="v num">{unit.living_surface}</span><span className="l">m² habitables</span></div> : null}
              {o && <div><span className="v num">{o.m2}</span><span className="l">m² {o.kind === 'garden' ? 'de jardin' : 'de terrasse'}</span></div>}
            </div>
            <dl className="facts">
              {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="num">{v}</dd></div>)}
            </dl>
            {features.length > 0 && <p className="features">{features.join(' · ')}</p>}
            {!sold ? (
              <a className="button" href="#demande">{unit.status === 'reserved' ? 'Être informé si le lot se libère' : 'Demander ce lot'}</a>
            ) : (
              <a className="button ghost" href="/appartements?dispo=1#lots">Voir les lots disponibles</a>
            )}
            {phone && <p className="call">Ou appelez le <a href={tel(phone)}>{phone}</a></p>}
          </aside>
        </div>
      </div>

      <section className="section place-in" aria-labelledby="pi-h">
        <div className="wrap pi-grid">
          <div>
            <h2 id="pi-h">Position dans l’immeuble</h2>
            <p className="lede">Le lot {no ? `${no.replace('Lot ', '')} ` : ''}est encadré dans le plan de l’immeuble.{ori && ` Il est orienté ${ori.toLowerCase()}.`}</p>
          </div>
          <StackingPlan units={dev.units} extras={extras} current={unit.id} compact label="Position du lot dans l’immeuble" />
        </div>
      </section>

      {(photos.length > 0 || unit.description) && (
        <section className="section photos" aria-labelledby="ph-h">
          <div className="wrap">
            <h2 id="ph-h" className="sr-only">Photos et description</h2>
            {unit.description && <div className="prose lede desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(unit.description) }} />}
            {photos.length > 0 && (
              <div className="pgrid">
                {photos.slice(0, 5).map((p, i) => (
                  <Photo key={p.url} src={p} alt={p.alt || `${unitLabel(unit)}, photo ${i + 1}`} width={i === 0 ? 1200 : 800} height={i === 0 ? 800 : 600} sizes={i === 0 ? '(min-width: 1000px) 66vw, 100vw' : '(min-width: 1000px) 33vw, 50vw'} className={`p p${i}`} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section enquiry-sec on-dark" id="demande" aria-labelledby="e-h">
        <div className="wrap e-grid">
          <div className="e-text">
            <h2 id="e-h">{sold ? 'Ce lot est vendu' : `Demande pour le ${no ? no.replace(/^Lot\s*/, 'lot ') : roomsTitle}`}</h2>
            <p>{sold ? 'Indiquez un autre lot : nous vous envoyons son plan et son prix.' : 'Nous vous envoyons le plan, le descriptif et le prix, et vous proposons une visite de l’espace de vente.'}</p>
            {agent && (
              <div className="agent"><AgentContact agent={agent} org={site.org.name} tone="dark" /></div>
            )}
          </div>
          <div className="e-form">
            {sold ? (
              <EnquiryForm developmentId={dev.id} units={unitOptions(dev.units, extras)} agentName={agent?.first_name} message={`Bonjour, je m’intéresse aux ${dev.title.replace(/^Les /, '')}. Merci de me recontacter.`} />
            ) : (
              <EnquiryForm
                developmentId={dev.id}
                lotId={unit.id}
                agentName={agent?.first_name}
                message={`Bonjour, je suis intéressé(e) par le ${[no, unitLabel(unit)].filter(Boolean).join(', ')} aux ${dev.title.replace(/^Les /, '')}. Merci de me recontacter.`}
                submitLabel="Envoyer ma demande"
              />
            )}
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section similar" aria-labelledby="s-h">
          <div className="wrap">
            <h2 id="s-h">Autres {roomsTitle} disponibles</h2>
            <ul className="s-list">
              {similar.map((u) => {
                const p = planFor(u, dev.units);
                const so = outdoor(u);
                return (
                  <li key={u.id}>
                    <a href={unitPath(u)}>
                      {p && <span className="s-plan"><img src={p.replace(/\.svg$/, '-fit.svg')} alt="" width="1000" height="750" loading="lazy" decoding="async" /></span>}
                      <span className="s-t">{[unitNumber(u), floorName(u)].filter(Boolean).join(' · ')}</span>
                      <span className="s-m num">{formatSurface(u.living_surface)}{so && ` · ${so.label.toLowerCase()} ${formatSurface(so.m2)}`}</span>
                      <span className="s-p num">{unitPrice(u)}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </Layout>
  );
}
