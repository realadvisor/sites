/**
 * Listing page: 1 + 4 gallery with "view all photos" (dialog); price, title
 * and key facts beside the agent card and enquiry form (sticky on desktop);
 * description, facts table, energy class, location; similar listings. On
 * phones a sticky "Message / Call" bar. Sold listings show no price and are
 * noindex.
 */
import type { Route } from './+types/listing';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { listingIdFromSlug, sanitizeHtml } from '@realadvisor/sites-kit';
import { featureLabel } from '@realadvisor/sites-kit/i18n';
import { img } from '@realadvisor/sites-kit/image';
import { listingJsonLd, listingRef, listingTitle } from '@realadvisor/sites-kit/seo';
import { Site } from '../components/Site';
import { Crumbs } from '../components/Crumbs';
import { Gallery } from '../components/Gallery';
import { AgentCard } from '../components/AgentCard';
import { ListingCard } from '../components/ListingCard';
import { StaticMap } from '../components/StaticMap';
import { EnergyScale } from '../components/EnergyScale';
import { agentOf, cardOf, siteData, sites } from '../lib/data.server';
import { href, langOfPath, LOCALE, type L } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { bathrooms, bedrooms, formatSurface, money, price, tel, typeLabel } from '../lib/format';
import { teamOf } from '../lib/regions';
import './listing.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const l = langOfPath(url.pathname);
  const x = await sites.listing(params.slug);
  // A slug that ends with a listing id was a listing of this site: 410 Gone.
  if (!x) throw notFound(!!listingIdFromSlug(params.slug));
  const [{ org, teams, agents }, sameTeam, all] = await Promise.all([
    siteData(),
    sites.allListings({ status: 'available', team_id: x.team_ids[0] }),
    sites.allListings(),
  ]);
  const team = teamOf(x, teams);
  const agent = x.agent ? (agents.find((a) => a.id === x.agent!.id) ?? x.agent) : undefined;
  const kitX = x;
  const sameCity = all.filter((o) => o.address.city === x.address.city);
  const pageUrl = new URL(url.pathname, siteUrl()).href;
  return {
    l,
    x,
    orgName: org.name,
    team: team && { name: team.name, phone: team.phone },
    agent: agent && agentOf(agent as never),
    agents: agents.map(({ id, first_name, last_name }) => ({ id, first_name, last_name })),
    teams: teams.map(({ id, name, address }) => ({ id, name, address })),
    similar: sameTeam.filter((o) => o.id !== x.id && o.offer_type === x.offer_type).slice(0, 3).map(cardOf),
    titleBase: listingTitle(kitX, sameCity),
    jsonLd: listingJsonLd(kitX, pageUrl),
    ex: {
      energy: x.energy_class,
      yearBuilt: x.construction_year,
      terrace: x.terrace_surface,
      floor: x.floor,
      charges: x.offer_type === 'rent' ? x.charges : undefined,
    },
  };
}

const COPY = (l: L, x: { title: string; address: { country?: string } }, sold: boolean, ref: string) =>
  ({
    en: {
      about: 'About this property', facts: 'Key facts', type: 'Type', rooms: 'Rooms', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms',
      living: 'Living area', land: 'Land', terrace: 'Terrace', floor: 'Floor', built: 'Year built', charges: 'Extra costs',
      features: 'Features', location: 'Location', map: 'Open in OpenStreetMap', area: (c: string) => `Approximate location in ${c}`,
      energy: x.address.country === 'France' ? 'Energy performance (DPE)' : 'Energy class', klass: (c: string) => `Class ${c}`,
      ask: 'Ask about this property', askSold: 'Looking for something similar?', similar: sold ? 'Available in the same area' : 'Similar properties',
      month: 'month', ref: 'Ref.', approx: 'The address is shown approximately; the agent gives the exact location.',
      interested: `I am interested in “${x.title}” (ref. ${ref}).`, call: 'Call', message: 'Message',
    },
    fr: {
      about: 'Le bien', facts: 'Caractéristiques', type: 'Type', rooms: 'Pièces', bedrooms: 'Chambres', bathrooms: 'Salles de bains',
      living: 'Surface habitable', land: 'Terrain', terrace: 'Terrasse', floor: 'Étage', built: 'Année de construction', charges: 'Charges',
      features: 'Équipements', location: 'Situation', map: 'Ouvrir dans OpenStreetMap', area: (c: string) => `Situation approximative à ${c}`,
      energy: x.address.country === 'France' ? 'Diagnostic de performance énergétique (DPE)' : 'Classe énergétique', klass: (c: string) => `Classe ${c}`,
      ask: 'Demander des informations', askSold: 'Vous cherchez un bien semblable ?', similar: sold ? 'Disponibles dans le même secteur' : 'Biens semblables',
      month: 'mois', ref: 'Réf.', approx: 'L’adresse est indiquée de façon approximative ; l’agent vous donne la situation exacte.',
      interested: `Je suis intéressé(e) par « ${x.title} » (réf. ${ref}).`, call: 'Appeler', message: 'Message',
    },
  })[l];

export default function ListingPage({ loaderData: d }: Route.ComponentProps) {
  const { l, x, agent, team, ex } = d;
  const t = tx(l);
  const sold = x.status === 'sold';
  const ref = listingRef(x);
  const C = COPY(l, x, sold, ref);
  const callPhone = agent?.phone ?? team?.phone;
  const city = cityName(x.address.city, l);
  const country = x.address.country === 'Switzerland' ? (l === 'fr' ? 'Suisse' : 'Switzerland') : x.address.country;
  const { energy, yearBuilt, terrace, floor, charges } = ex;
  const facts: [string, string][] = [
    [C.type, typeLabel(x.property_type, l)],
    x.rooms != null ? [C.rooms, String(x.rooms)] : null,
    x.bedrooms != null ? [C.bedrooms, String(x.bedrooms)] : null,
    x.bathrooms != null ? [C.bathrooms, String(x.bathrooms)] : null,
    x.living_surface ? [C.living, formatSurface(x.living_surface)] : null,
    x.land_surface ? [C.land, formatSurface(x.land_surface)] : null,
    terrace ? [C.terrace, formatSurface(terrace)] : null,
    floor != null ? [C.floor, String(floor)] : null,
    yearBuilt ? [C.built, String(yearBuilt)] : null,
    charges ? [C.charges, `${money(charges, x.currency, l)} / ${C.month}`] : null,
  ].filter(Boolean) as [string, string][];
  const summary = [bedrooms(x.bedrooms, l), bathrooms(x.bathrooms, l), x.living_surface ? formatSurface(x.living_surface) : '', x.land_surface ? `${formatSurface(x.land_surface)} ${t('land')}` : ''].filter(Boolean);
  const section = sold ? 'sold' : x.offer_type === 'rent' ? 'rent' : 'buy';
  return (
    <Site l={l} route="listing" segs={[x.slug]} section={section} barSpace
      title={`${d.titleBase} | ${price(x, l)}`} description={(x.description_text ?? x.title).slice(0, 155)}
      image={x.photos[0] && img(x.photos[0].url, { w: 1200, h: 630 })}
      jsonLd={d.jsonLd} noindex={sold}>
      <div className="wrap top">
        <Crumbs label={t('breadcrumb')} items={[
          { label: t('home'), href: href('home', l) },
          { label: sold ? t('navSold') : x.offer_type === 'rent' ? t('navRent') : t('navBuy'), href: href(section, l) },
          { label: city || x.title },
        ]} />
        <Gallery photos={x.photos} title={x.title} l={l} badge={sold ? t('sold') : undefined} />
      </div>

      <div className="wrap body">
        <div className="main">
          <header className="intro">
            <p className="intro__price num">{price(x, l)}</p>
            <h1 className="intro__title">{x.title}</h1>
            {summary.length > 0 && <p className="intro__facts">{summary.map((s, i) => <span key={i} className="num">{s}</span>)}</p>}
            <p className="intro__place">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
              {[x.address.postcode, city].filter(Boolean).join(' ')}{country && `, ${country}`}{' '}
              <span className="intro__ref">{C.ref} {ref}</span>
            </p>
          </header>

          {x.description && (
            <section className="block">
              <h2 className="block__h">{C.about}</h2>
              <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(x.description) }} />
            </section>
          )}

          <section className="block">
            <h2 className="block__h">{C.facts}</h2>
            <dl className="facts">
              {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="num">{v}</dd></div>)}
            </dl>
            {x.features.length > 0 && (
              <>
                <h3 className="block__sub">{C.features}</h3>
                <ul className="plain feats">{x.features.map((f) => <li key={f}>{featureLabel(f, LOCALE[l])}</li>)}</ul>
              </>
            )}
          </section>

          {energy && (
            <section className="block">
              <h2 className="block__h">{C.energy}</h2>
              <EnergyScale value={energy} label={C.energy} classLabel={C.klass(energy)} />
            </section>
          )}

          {x.address.lat != null && x.address.lng != null && (
            <section className="block">
              <h2 className="block__h">{C.location}</h2>
              <StaticMap lat={x.address.lat} lng={x.address.lng} zoom={13} area label={C.area(city)} linkLabel={C.map} height={360} />
              <p className="small muted note">{C.approx}</p>
            </section>
          )}
        </div>

        <aside className="side" id="contact-agent">
          <div className="side__card">
            {agent && <AgentCard agent={agent} all={d.agents} teams={d.teams} l={l} compact />}
            {!agent && team && (
              <p className="side__team"><strong>{d.orgName}</strong><br />{team.name}</p>
            )}
            {callPhone && (
              <a className="cta cta--ghost side__call" href={tel(callPhone)}>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
                {C.call} <span className="num">{callPhone}</span>
              </a>
            )}
            <h2 className="side__h">{sold ? C.askSold : C.ask}</h2>
            <EnquiryForm listingId={x.id} agentId={agent?.id} agentName={agent?.first_name} message={C.interested} locale={LOCALE[l]} />
          </div>
        </aside>
      </div>

      {d.similar.length > 0 && (
        <section className="section similar">
          <div className="wrap">
            <h2 className="h2 similar__h">{C.similar}</h2>
            <ul className="plain grid3">{d.similar.map((o) => <li key={o.id}><ListingCard listing={o} l={l} /></li>)}</ul>
          </div>
        </section>
      )}

      <div className="bar" aria-label={`${C.message} / ${C.call}`} role="group">
        <a className="cta bar__msg" href="#enquiry">{C.message}</a>
        {callPhone && <a className="cta cta--ghost bar__call" href={tel(callPhone)}>{C.call}</a>}
      </div>
    </Site>
  );
}
