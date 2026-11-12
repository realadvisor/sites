// One unit: plan first, rent (net + charges), move-in date, facts, its place
// in the building, photos, and the application / enquiry form with the unit
// preselected. Unknown unit: 404. A let unit stays reachable (noindex) with
// similar free units and a register-interest form.
import { redirect } from 'react-router';
import type { Route } from './+types/unit';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { featureLabel } from '@realadvisor/sites-kit/i18n';
import { img } from '@realadvisor/sites-kit/image';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { StackingPlan } from '../components/StackingPlan';
import { ContactCard } from '../components/ContactCard';
import { Icon } from '../components/Icon';
import { rowsOf, site as load } from '../lib/data.server';
import {
  buildings, chf, floorShort, freeRent, longDate, netRent, orientationCode, orientationLabel, planUrl, rooms, statusLabel, surface, unitIdFromSlug, unitOptions, unitTitle, unitUrl,
} from '../lib/units';
import './unit.css';

export async function loader({ params, request }: Route.LoaderArgs) {
  const site = await load();
  const { dev } = site;
  const id = unitIdFromSlug(params.slug ?? '');
  const rows = rowsOf(dev);
  const row = rows.find((r) => r.u.id === id);
  if (!row) throw notFound();
  const { u, x } = row;
  // Canonical slug: redirect an outdated name to the current one.
  if (unitUrl(u) !== new URL(request.url).pathname) throw redirect(unitUrl(u), 301);

  const house = buildings(rows).find((b) => b.key === x.building);
  const rent = netRent(u);
    const charges = rent ? u.charges : undefined;
  const isLet = u.status === 'sold';
  const outdoor = u.floor === 0 ? 'Gartensitzplatz' : 'Loggia';
  const facts: [string, string][] = [
    ['Zimmer', rooms(u)],
    ['Wohnfläche', surface(u.living_surface)],
    [outdoor, u.balcony_surface ? surface(u.balcony_surface) : ''],
    ['Geschoss', u.floor_label ?? floorShort(u)],
    // fixture only: building
    ['Haus', x.building ? `Haus ${x.building}` : ''],
    ['Wohnungsnummer', u.reference ?? ''],
    ['Ausrichtung', orientationLabel(orientationCode(u))],
    ['Bad / Dusche', u.bathrooms ? String(u.bathrooms) : ''],
    ['Bezug ab', longDate(u.available_from)],
  ].filter((f): f is [string, string] => !!f[1]);
  // Ground-floor units have a garden seat, not a balcony: drop that CRM feature there.
  const features = (u.features ?? []).filter((k) => !(u.floor === 0 && k === 'balcony')).map((k) => featureLabel(k, 'de-CH')).filter(Boolean);
  const photos = u.photos ?? [];
  const name = unitTitle(row);
  const desc = [name, u.reference, statusLabel(u), rent ? `${chf(rent)} netto pro Monat` : '', u.available_from ? `Bezug ab ${longDate(u.available_from)}` : ''].filter(Boolean).join(' · ');
  const similar = rows
    .filter((r) => r.u.id !== u.id && r.u.rooms === u.rooms && r.u.status === 'available')
    .sort((a, b) => (freeRent(a.u) ?? 0) - (freeRent(b.u) ?? 0))
    .slice(0, 3);
  return {
    meta: {
      title: `${name}${u.reference ? ` (${u.reference})` : ''} | ${rent ? `${chf(rent)} netto` : statusLabel(u)} | ${dev.title}`,
      description: desc,
      image: photos[0] ? img(photos[0].url, { w: 1200, h: 630 }) : dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 }),
      noindex: isLet,
    },
    devId: dev.id,
    devTitle: dev.title,
    row,
    house,
    rent,
    charges,
    gross: rent && charges ? rent + charges : undefined,
    plan: planUrl(u, orientationCode(u)),
    isLet,
    outdoor,
    facts,
    features,
    photos,
    description: u.description ?? '',
    name,
    similar,
    units: isLet ? unitOptions(rows) : [],
    contact: site.contact,
    team: site.team && { name: site.team.name, phone: site.team.phone, email: site.team.email },
    message: isLet
      ? `Guten Tag, die Wohnung ${u.reference ?? name} ist vermietet. Bitte informieren Sie mich über ähnliche Wohnungen im ${dev.title}.`
      : `Guten Tag, ich interessiere mich für die Wohnung ${u.reference ? `${u.reference} (${name})` : name} im ${dev.title}. Bitte senden Sie mir die Bewerbungsunterlagen.`,
  };
}

export default function Unit({ loaderData: d }: Route.ComponentProps) {
  const { u, x } = d.row;
  const { house, rent, charges, gross, name, isLet, outdoor, photos, similar, team } = d;
  return (
    <Layout page="unit" {...d.meta}>
      <nav className="crumbs wrap" aria-label="Brotkrumen">
        <a href="/wohnungen"><Icon name="back" size={18} /> Alle Wohnungen</a>
        {house && <a href={`/wohnungen?haus=${house.key}`}>{house.name}</a>}
      </nav>

      <section className="unit wrap">
        <header className="u-head">
          <div className="u-title">
            <p className="badges">
              {u.reference && <span className={`no tone-${(x.building ?? 'a').toLowerCase()} num`}>{u.reference}</span>}
              <span className={`pill pill--${u.status}`}>{statusLabel(u)}</span>
            </p>
            <h1>{name}</h1>
          </div>
          <dl className="big">
            <div><dt>Zimmer</dt><dd className="num">{String(u.rooms ?? '')}</dd></div>
            {u.living_surface && <div><dt>Wohnfläche</dt><dd className="num">{u.living_surface}<small> m²</small></dd></div>}
            {u.balcony_surface && <div><dt>{outdoor}</dt><dd className="num">{u.balcony_surface}<small> m²</small></dd></div>}
          </dl>
        </header>

        <div className="u-grid">
          <div className="left">
            <figure className="plan">
              {d.plan ? (
                <img src={d.plan} width="600" height="470" alt={`Grundriss indikativ ${name}${orientationCode(u) ? `, Loggia nach ${orientationLabel(orientationCode(u))}` : ''}`} fetchPriority="high" decoding="async" />
              ) : (
                <p className="plan-none">Grundriss auf Anfrage</p>
              )}
              <figcaption>Grundriss indikativ, nicht massgebend. Möblierung als Beispiel. <a href="/dokumente">Alle Grundrisse als PDF</a></figcaption>
            </figure>
            {house && (
              <div className="where">
                <h2 className="where-title">Lage im Haus</h2>
                <p className="muted">{name}{orientationCode(u) ? `, Ausrichtung ${orientationLabel(orientationCode(u))}` : ''}. Markiert im Stockwerkplan von {house.name}.</p>
                <StackingPlan building={house} current={u.id} compact headingLevel={3} />
              </div>
            )}
          </div>

          <aside className="panel" aria-label="Miete und Bezug">
            {rent ? (
              <div className="rent">
                <p className="rent-gross num">{chf(gross ?? rent)}<span> / Monat</span></p>
                <dl className="rent-parts">
                  <div><dt>Nettomiete</dt><dd className="num">{chf(rent)}</dd></div>
                  {charges && <div><dt>Nebenkosten (Akonto)</dt><dd className="num">{chf(charges)}</dd></div>}
                  {gross && <div className="sum"><dt>Bruttomiete</dt><dd className="num">{chf(gross)}</dd></div>}
                </dl>
              </div>
            ) : (
              <p className="rent-none">Diese Wohnung ist vermietet.</p>
            )}
            {u.status === 'reserved' && (
              <p className="rent-note">Diese Wohnung ist reserviert. Setzen Sie sich auf die Warteliste: Springt die Reservation ab, melden wir uns bei Ihnen.</p>
            )}
            {u.available_from && (
              <p className="move"><Icon name="calendar" size={22} /><span>Bezug ab <strong>{longDate(u.available_from)}</strong></span></p>
            )}
            <div className="panel-cta">
              <a className="cta cta--zinnober" href="#bewerben">{isLet ? 'Ähnliche Wohnung anfragen' : u.status === 'reserved' ? 'Auf die Warteliste' : 'Jetzt bewerben'} <Icon name="arrow" /></a>
              {team?.phone && <a className="cta cta--ghost" href={`tel:${team.phone.replace(/[^\d+]/g, '')}`}><Icon name="phone" /> <span className="num">{team.phone}</span></a>}
            </div>
            <dl className="facts">
              {d.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            {d.features.length > 0 && <ul className="feat">{d.features.map((f) => <li key={f}><Icon name="check" size={16} />{f}</li>)}</ul>}
          </aside>
        </div>
      </section>

      {(photos.length > 0 || d.description) && (
        <section className="more band wrap" aria-labelledby="more-title">
          <h2 id="more-title" className="sec">Die Wohnung</h2>
          {d.description && <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(d.description) }} />}
          {photos.length > 0 && (
            <ul className="photos">
              {photos.slice(0, 5).map((p, i) => (
                <li key={p.url} className={i === 0 ? 'p-lead' : ''}><Photo src={p} alt={p.alt || `${name}, Bild ${i + 1}`} width={i === 0 ? 1200 : 800} height={i === 0 ? 800 : 533} sizes={i === 0 ? '(min-width: 900px) 60vw, 100vw' : '(min-width: 900px) 30vw, 50vw'} /></li>
              ))}
            </ul>
          )}
        </section>
      )}

      {similar.length > 0 && (
        <section className="similar band band--lilac" aria-labelledby="similar-title">
          <div className="wrap">
            <h2 id="similar-title" className="sec">{isLet ? 'Diese Wohnungen sind noch frei' : `Weitere ${String(u.rooms)}-Zimmer-Wohnungen`}</h2>
            <ul className="sim">
              {similar.map((r) => (
                <li key={r.u.id}>
                  <a href={unitUrl(r.u)}>
                    <span className="no num">{r.u.reference}</span>
                    <span className="nm">{unitTitle(r)}</span>
                    <span className="num">{surface(r.u.living_surface)} · {chf(freeRent(r.u)!)} netto</span>
                    <span className="mv">Bezug ab {longDate(r.u.available_from)}</span>
                    <Icon name="arrow" className="go" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="apply band band--zinnober" id="bewerben" aria-labelledby="apply-title">
        <div className="wrap apply-grid">
          <div className="apply-text">
            <h2 id="apply-title" className="apply-title">{isLet ? 'Interesse anmelden' : u.status === 'reserved' ? 'Warteliste' : 'Für diese Wohnung bewerben'}</h2>
            <p className="lead">{isLet ? 'Wählen Sie eine freie Wohnung, wir melden uns bei Ihnen.' : 'Senden Sie uns Ihre Anfrage. Sie erhalten das Bewerbungsformular und einen Termin für die Besichtigung der Musterwohnung.'}</p>
            {d.contact && <ContactCard agent={d.contact} team={team} />}
          </div>
          <div className="form-card">
            {isLet ? (
              <EnquiryForm id="bewerben-form" developmentId={d.devId} units={d.units} selectedUnit={similar[0]?.u.id} agentId={d.contact?.id} agentName={d.contact?.first_name} message={d.message} submitLabel="Interesse senden" />
            ) : (
              <>
                <p className="chosen"><span>Ihre Wohnung</span><strong>{name}{u.reference ? ` · ${u.reference}` : ''}</strong></p>
                <EnquiryForm id="bewerben-form" developmentId={d.devId} lotId={u.id} agentId={d.contact?.id} agentName={d.contact?.first_name} message={d.message} submitLabel={u.status === 'reserved' ? 'Auf die Warteliste' : 'Bewerbung anfragen'} />
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
