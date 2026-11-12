/** One office: photo, description from the data, address and contacts, the agents, its listings, a form. */
import type { Route } from './+types/office';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { Site } from '../components/Site';
import { Crumbs } from '../components/Crumbs';
import { Img } from '../components/Img';
import { AgentCard } from '../components/AgentCard';
import { ListingCard } from '../components/ListingCard';
import { StaticMap } from '../components/StaticMap';
import { agentOf, cardOf, findTeam, siteData, sites } from '../lib/data.server';
import { href, langOfPath, LOCALE, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import { placeOf } from '../content/places';
import './office.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const x = await findTeam(params.slug);
  if (!x) throw notFound();
  const [{ org, teams, agents }, listings] = await Promise.all([siteData(), sites.allListings({ team_id: x.id, status: 'available' })]);
  const slug = teamSlug(x, teams);
  const photo = placeOf(slug)?.photos[0];
  return {
    l,
    slug,
    orgName: org.name,
    x: { name: x.name, address: x.address, phone: x.phone, email: x.email, description: x.description, description_text: x.description_text },
    people: agents.filter((a) => a.team_ids.includes(x.id)).map(agentOf),
    agents: agents.map(({ id, first_name, last_name }) => ({ id, first_name, last_name })),
    teams: teams.map(({ id, name, address }) => ({ id, name, address })),
    listings: listings.slice(0, 6).map(cardOf),
    photo: photo && { url: photo.url, alt: photo.alt[l] },
  };
}

export default function Office({ loaderData: { l, slug, orgName, x, people, agents, teams, listings, photo } }: Route.ComponentProps) {
  const t = tx(l);
  const city = cityName(x.address.city, l) || x.name;
  const C = {
    en: { title: `${orgName.replace(/\s+SA$/, '')} ${city}`, team: 'The team', props: 'Properties from this office', write: `Write to the ${city} office`, map: `Map: ${x.address.street ?? city}`, osm: 'Open in OpenStreetMap', dest: `About ${city}` },
    fr: { title: `${orgName.replace(/\s+SA$/, '')} ${city}`, team: 'L’équipe', props: 'Les biens de ce bureau', write: `Écrire au bureau de ${city}`, map: `Plan : ${x.address.street ?? city}`, osm: 'Ouvrir dans OpenStreetMap', dest: `Découvrir ${city}` },
  }[l];
  return (
    <Site l={l} route="offices" segs={[slug]} title={`${C.title} | ${orgName}`} description={x.description_text ?? `${C.title}: ${x.address.street ?? ''} ${x.address.city ?? ''}`}>
      <div className="wrap top">
        <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navOffices'), href: href('offices', l) }, { label: city }]} />
      </div>
      <section className="wrap hero">
        <div className="hero__text">
          <h1 className="h1">{C.title}</h1>
          {x.description && <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(x.description) }} />}
          <address>
            {x.address.street && <span>{x.address.street}</span>}
            <span>{[x.address.postcode, x.address.city].filter(Boolean).join(' ')}</span>
          </address>
          <ul className="plain contacts">
            {x.phone && <li><a className="num" href={tel(x.phone)}>{x.phone}</a></li>}
            {x.email && <li><a href={`mailto:${x.email}`}>{x.email}</a></li>}
          </ul>
          <a className="link" href={href('destinations', l, slug)}>{C.dest}</a>
        </div>
        {photo && <div className="hero__media"><Img src={photo.url} alt={photo.alt} width={900} height={1100} priority sizes="(min-width: 1024px) 45vw, 100vw" mobile={{ width: 800, height: 600 }} /></div>}
      </section>
      {people.length > 0 && (
        <section className="wrap block">
          <h2 className="h2 block__h">{C.team}</h2>
          <ul className="plain agents">{people.map((a) => <li key={a.id}><AgentCard agent={a} all={agents} teams={teams} l={l} /></li>)}</ul>
        </section>
      )}
      {listings.length > 0 && (
        <section className="wrap block">
          <h2 className="h2 block__h">{C.props}</h2>
          <ul className="plain grid3">{listings.map((y) => <li key={y.id}><ListingCard listing={y} l={l} /></li>)}</ul>
        </section>
      )}
      <section className="on-paper form">
        <div className="wrap form__in">
          <div>
            <h2 className="h2">{C.write}</h2>
            {x.address.lat != null && x.address.lng != null && <StaticMap lat={x.address.lat} lng={x.address.lng} zoom={15} height={300} label={C.map} linkLabel={C.osm} className="form__map" />}
          </div>
          <EnquiryForm contactReason="other" locale={LOCALE[l]} />
        </div>
      </section>
    </Site>
  );
}
