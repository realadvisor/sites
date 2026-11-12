/** One office: photo, address, contacts, map, the team, its listings and a form to write to the office. */
import type { Route } from './+types/office';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { img } from '@realadvisor/sites-kit/image';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { Crumbs } from '../components/Crumbs';
import { AgentCard } from '../components/AgentCard';
import { ListingCard } from '../components/ListingCard';
import { StaticMap } from '../components/StaticMap';
import { cardOf, findTeam, siteData, sites } from '../lib/data.server';
import { placeOf } from '../content/places';
import { href, langOfPath, LOCALE, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './office.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const x = await findTeam(params.slug);
  if (!x) throw notFound();
  const [{ org, teams, agents }, listings] = await Promise.all([siteData(), sites.allListings({ team_id: x.id, status: 'available' })]);
  return {
    l, x, teams, orgName: org.name,
    slug: teamSlug(x, teams),
    agents: agents.map(({ id, first_name, last_name }) => ({ id, first_name, last_name })),
    crew: agents.filter((a) => a.team_ids.includes(x.id)),
    listings: listings.slice(0, 6).map(cardOf),
    total: listings.length,
    buyN: listings.filter((y) => y.offer_type === 'buy').length,
  };
}

export default function Office({ loaderData: { l, x, teams, orgName, slug, agents, crew, listings, total, buyN } }: Route.ComponentProps) {
  const t = tx(l);
  const city = cityName(x.address.city, l) || x.name;
  const place = placeOf(slug);
  const addr = [x.address.street, [x.address.postcode, cityName(x.address.city, l)].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return (
    <Site l={l} route="offices" segs={[slug]} title={`${t('officeOf', { city })} | ${orgName}`} description={[t('officeOf', { city }), addr, x.phone].filter(Boolean).join(' · ')}
      image={place && img(place.photo, { w: 1200, h: 630 })}>
      <section className="hero on-green">
        <div className="hero__grid">
          <div className="hero__text wrap-l">
            <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navOffices'), href: href('offices', l) }, { label: city }]} />
            <h1 className="h1">{t('officeOf', { city })}</h1>
            {x.description_text && <p className="lede">{x.description_text}</p>}
            <address>{addr}</address>
            <ul className="plain-list links">
              {x.phone && <li><a className="num" href={tel(x.phone)}>{x.phone}</a></li>}
              {x.email && <li><a href={`mailto:${x.email}`}>{x.email}</a></li>}
            </ul>
          </div>
          {place && <div className="hero__media"><Img src={place.photo} alt={place.alt[l]} width={1200} height={900} priority sizes="(min-width: 1000px) 50vw, 100vw" mobile={{ width: 800, height: 560 }} /></div>}
        </div>
      </section>

      {crew.length > 0 && (
        <section className="section wrap" aria-labelledby="h-team">
          <h2 id="h-team" className="h2 sec-h">{t('team')}</h2>
          <ul className="plain-list cards">{crew.map((a) => <li key={a.id}><AgentCard agent={a} agents={agents} teams={teams} l={l} /></li>)}</ul>
        </section>
      )}

      {listings.length > 0 && (
        <section className="section section--paper" aria-labelledby="h-list">
          <div className="wrap">
            <h2 id="h-list" className="h2 sec-h">{t('officeListings', { city })}</h2>
            <ul className="plain-list grid3">{listings.map((y) => <li key={y.id}><ListingCard listing={y} l={l} /></li>)}</ul>
            {total > 6 && <p className="all"><a className="more" href={`${href('buy', l)}?city=${encodeURIComponent(x.address.city ?? '')}`}>{t('allBuyN', { n: buyN })}</a></p>}
          </div>
        </section>
      )}

      <section className="section wrap cols" aria-labelledby="h-write">
        <div className="form">
          <h2 id="h-write" className="h3">{t('officeContact', { city })}</h2>
          <EnquiryForm locale={LOCALE[l]} contactReason="other" message={t('officeMessage', { city })} />
        </div>
        {x.address.lat != null && x.address.lng != null && (
          <StaticMap lat={x.address.lat} lng={x.address.lng} zoom={15} height={460} label={`${t('officeOf', { city })}: ${addr}`} linkLabel={t('directions')} />
        )}
      </section>
    </Site>
  );
}
