/** One office (team): address, phone, email, map, its advisors, its listings, a message to the office. */
import type { Route } from './+types/office';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { sanitizeHtml } from '@realadvisor/sites-kit-core';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { AgentCard } from '../components/AgentCard';
import { ListingCard } from '../components/ListingCard';
import { StaticMap } from '../components/StaticMap';
import { PlacePhoto } from '../components/PlacePhoto';
import { findTeam, siteData, sites } from '../lib/data.server';
import { agentSlug, href, langOf, LOCALE, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import { officePlace, placeAlt, placeOg } from '../content/places';
import './office.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOf(new URL(request.url).pathname);
  const team = await findTeam(params.slug);
  if (!team) throw notFound();
  const [{ org, teams, agents }, listings] = await Promise.all([siteData(), sites.allListings({ team_id: team.id, status: 'available' })]);
  const members = agents.filter((a) => a.team_ids.includes(team.id)).map((a) => ({ ...a, slug: agentSlug(a, agents) }));
  return { l, team, slug: teamSlug(team, teams), name: org.name, members, listings };
}

export default function Page({ loaderData: { l, team, slug, name, members, listings } }: Route.ComponentProps) {
  const t = tx(l);
  const city = cityName(team.address.city, l) || team.name;
  const place = officePlace(team.address.city);
  const addr = [team.address.street, [team.address.postcode, cityName(team.address.city, l)].filter(Boolean).join(' ')].filter(Boolean);
  const buyN = listings.filter((x) => x.offer_type === 'buy').length;
  const rentN = listings.filter((x) => x.offer_type === 'rent').length;
  return (
    <Layout l={l} route="offices" segs={[slug]} title={`${t('officeOf', { city })} | ${name}`}
      description={team.description_text ?? `${t('officeOf', { city })} · ${addr.join(', ')}`}
      image={place && placeOg(place)}>
      <section className="hero on-navy">
        <div className="hero__copy">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navOffices'), href: href('offices', l) }, { label: city }]} />
          <h1 className="h1">{t('officeOf', { city })}</h1>
          {team.description && <div className="hero__desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(team.description) }} />}
          <dl className="hero__contact">
            {addr.length > 0 && <div><dt>{t('address')}</dt><dd>{addr.map((a) => <span key={a}>{a}</span>)}</dd></div>}
            {team.phone && <div><dt>{t('phone')}</dt><dd><a className="num" href={tel(team.phone)}>{team.phone}</a></dd></div>}
            {team.email && <div><dt>{t('email')}</dt><dd><a href={`mailto:${team.email}`}>{team.email}</a></dd></div>}
          </dl>
        </div>
        <div className="hero__media">
          {place && <PlacePhoto place={place} alt={placeAlt(place, l)} width={1200} height={1000} priority sizes="(min-width: 1025px) 46vw, 100vw" mobile={{ width: 800, height: 560 }} />}
        </div>
      </section>

      {members.length > 0 && (
        <section className="section section--paper">
          <div className="wrap">
            <h2 className="h2 sec-h">{t('team')} <span className="sec-h__n num">{members.length === 1 ? t('nAgent1') : t('nAgents', { n: members.length })}</span></h2>
            <ul className="plain-list grid grid--3">{members.map((a) => <li key={a.id}><AgentCard agent={a} slug={a.slug} team={team} l={l} /></li>)}</ul>
          </div>
        </section>
      )}

      {listings.length > 0 && (
        <section className="section">
          <div className="wrap">
            <h2 className="h2 sec-h">{t('officeListings')} <span className="sec-h__n num">{[buyN > 0 && `${t('areaForSale')} ${buyN}`, rentN > 0 && `${t('areaForRent')} ${rentN}`].filter(Boolean).join(' · ')}</span></h2>
            <ul className="plain-list grid grid--3">{listings.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
          </div>
        </section>
      )}

      <section className="section section--paper" id="contact">
        <div className="wrap contact">
          <div className="contact__form">
            <h2 className="h2">{t('officeContact')}</h2>
            <EnquiryForm locale={LOCALE[l]} contactReason="other" message={t('officeMessage', { city })} />
          </div>
          {team.address.lat != null && team.address.lng != null && (
            <StaticMap lat={team.address.lat} lng={team.address.lng} zoom={15} height={460} label={`${t('officeOf', { city })}: ${addr.join(', ')}`} linkLabel={t('directions')} />
          )}
        </div>
      </section>
    </Layout>
  );
}
