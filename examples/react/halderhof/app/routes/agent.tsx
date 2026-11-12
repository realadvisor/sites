/** One adviser: portrait, office, languages, contacts, an enquiry form addressed to them, and their listings. */
import type { Route } from './+types/agent';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { img } from '@realadvisor/sites-kit/image';
import { Site } from '../components/Site';
import { Crumbs } from '../components/Crumbs';
import { Portrait } from '../components/Portrait';
import { ListingCard } from '../components/ListingCard';
import { cardOf, findAgent, siteData, sites } from '../lib/data.server';
import { agentSlug, href, langOfPath, LOCALE, teamSlug } from '../lib/routes';
import { cityName, langNames, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './agent.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const a = await findAgent(params.slug);
  if (!a) throw notFound();
  const [{ org, teams, agents }, all] = await Promise.all([siteData(), sites.allListings()]);
  const mine = all.filter((x) => x.agent?.id === a.id).map(cardOf);
  const team = teams.find((x) => a.team_ids.includes(x.id));
  return {
    l, a, orgName: org.name,
    slug: agentSlug(a, agents),
    team: team && { city: team.address.city, name: team.name, slug: teamSlug(team, teams) },
    live: mine.filter((x) => x.status === 'available'),
    sold: mine.filter((x) => x.status === 'sold'),
  };
}

export default function AgentPage({ loaderData: { l, a, orgName, slug, team, live, sold } }: Route.ComponentProps) {
  const t = tx(l);
  const city = team ? cityName(team.city, l) || team.name : '';
  const name = `${a.first_name} ${a.last_name}`;
  const role = a.title ?? (team ? t('adviserAt', { city }) : undefined);
  const langs = langNames(a.languages, l);
  return (
    <Site l={l} route="team" segs={[slug]} title={`${name}${role ? `, ${role}` : ''} | ${orgName}`}
      description={[name, role, langs].filter(Boolean).join(' · ')} image={a.photo?.url && img(a.photo.url, { w: 1200, h: 630 })}>
      <section className="hero">
        <div className="wrap hero__in">
          {a.photo?.url && <div className="hero__photo"><Portrait agent={a} w={560} sizes="(min-width: 900px) 360px, 60vw" priority /></div>}
          <div className="hero__text">
            <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navTeam'), href: href('team', l) }, { label: name }]} />
            <h1 className="h1">{name}</h1>
            {role && <p className="role">{team ? <a href={href('offices', l, team.slug)}>{role}</a> : role}</p>}
            <dl className="facts">
              {langs && <div><dt>{t('languages')}</dt><dd>{langs}</dd></div>}
              {a.phone && <div><dt>{t('phone')}</dt><dd><a className="num" href={tel(a.phone)}>{a.phone}</a></dd></div>}
              {a.email && <div><dt>{t('email')}</dt><dd><a href={`mailto:${a.email}`}>{a.email}</a></dd></div>}
            </dl>
            {a.bio && <p className="bio">{a.bio}</p>}
          </div>
        </div>
      </section>

      <div className="wrap section cols">
        <section aria-labelledby="h-listings">
          <h2 id="h-listings" className="h3 sec-h">{t('agentListings', { name: a.first_name })}</h2>
          {live.length > 0
            ? <ul className="plain-list grid2">{live.map((x, i) => <li key={x.id}><ListingCard listing={x} l={l} priority={!a.photo?.url && i === 0} /></li>)}</ul>
            : <p className="muted">{t('noAgentListings', { name: a.first_name })}</p>}
          {sold.length > 0 && (
            <>
              <h2 className="h3 sec-h sold-h">{t('recentSales')}</h2>
              <ul className="plain-list grid2">{sold.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
            </>
          )}
        </section>
        <aside className="side" aria-labelledby="h-write">
          <h2 id="h-write" className="h3">{t('contactAgent', { name: a.first_name })}</h2>
          <EnquiryForm locale={LOCALE[l]} agentId={a.id} agentName={a.first_name} contactReason="other" message={t('agentMessage', { name: a.first_name })} />
        </aside>
      </div>
    </Site>
  );
}
