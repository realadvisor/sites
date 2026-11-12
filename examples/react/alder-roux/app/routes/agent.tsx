/** One advisor: contact, office, languages, their listings and sales, enquiry form addressed to them. */
import type { Route } from './+types/agent';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { Img } from '../components/Img';
import { ListingCard } from '../components/ListingCard';
import { findAgent, siteData, sites } from '../lib/data.server';
import { agentSlug, href, langOf, LOCALE, teamSlug } from '../lib/routes';
import { cityName, langName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './agent.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOf(new URL(request.url).pathname);
  const agent = await findAgent(params.slug);
  if (!agent) throw notFound();
  const [{ org, teams, agents }, all] = await Promise.all([siteData(), sites.allListings()]);
  const mine = all.filter((x) => x.agent?.id === agent.id);
  const team = teams.find((tm) => agent.team_ids.includes(tm.id));
  return {
    l, agent, name: org.name,
    slug: agentSlug(agent, agents),
    team: team && { ...team, slug: teamSlug(team, teams) },
    active: mine.filter((x) => x.status === 'available'),
    sold: mine.filter((x) => x.status === 'sold'),
  };
}

export default function Page({ loaderData: { l, agent, name: orgName, slug, team, active, sold } }: Route.ComponentProps) {
  const t = tx(l);
  const name = `${agent.first_name} ${agent.last_name}`;
  const langs = (agent.languages ?? []).map((x) => langName(x, l));
  const office = team && t('officeOf', { city: cityName(team.address.city, l) || team.name });
  const desc = [name, office, orgName].filter(Boolean).join(' · ');
  return (
    <Layout l={l} route="team" segs={[slug]} title={`${name} · ${office ?? ''} | ${orgName}`} description={desc}>
      <section className="band on-navy">
        <div className="wrap ag">
          <div className="ag__id">
            <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navTeam'), href: href('team', l) }, { label: name }]} />
            <div className="ag__row">
              {agent.photo?.url && <Img className="ag__photo" src={agent.photo} alt={name} width={320} height={400} sizes="(min-width: 521px) 160px, 128px" priority />}
              <div className="ag__txt">
                {team && <span className="eyebrow">{agent.title ? `${agent.title} · ` : ''}{office}</span>}
                <h1 className="h1">{name}</h1>
                {langs.length > 0 && <p className="lede">{t('speaks', { langs: langs.join(', ') })}</p>}
              </div>
            </div>
            {agent.bio && <p className="ag__bio">{agent.bio}</p>}
          </div>
          <dl className="ag__contact">
            {agent.phone && <div><dt>{t('phone')}</dt><dd><a className="num" href={tel(agent.phone)}>{agent.phone}</a></dd></div>}
            {agent.email && <div><dt>{t('email')}</dt><dd><a href={`mailto:${agent.email}`}>{agent.email}</a></dd></div>}
            {team && <div><dt>{t('navOffices')}</dt><dd><a href={href('offices', l, team.slug)}>{[team.address.street, [team.address.postcode, cityName(team.address.city, l)].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</a></dd></div>}
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="head"><div><h2 className="h2">{t('agentListings', { name: agent.first_name })}</h2></div></div>
          {active.length > 0
            ? <ul className="plain-list grid grid--3">{active.map((x, i) => <li key={x.id}><ListingCard listing={x} l={l} priority={i === 0} /></li>)}</ul>
            : <p className="lede">{t('noAgentListings', { name: agent.first_name })}</p>}
        </div>
      </section>

      {sold.length > 0 && (
        <section className="section section--paper">
          <div className="wrap">
            <div className="head"><div><h2 className="h2">{t('agentSold')}</h2></div></div>
            <ul className="plain-list grid grid--3">{sold.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
          </div>
        </section>
      )}

      <section className="section" id="contact">
        <div className="wrap form">
          <h2 className="h2">{t('contactAgent', { name: agent.first_name })}</h2>
          <EnquiryForm locale={LOCALE[l]} agentId={agent.id} agentName={agent.first_name} contactReason="other" message={t('agentMessage', { name: agent.first_name })} />
        </div>
      </section>
    </Layout>
  );
}
