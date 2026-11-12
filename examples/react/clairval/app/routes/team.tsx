/** Team: agents grouped by office, portraits when the data has them, plain contacts. */
import type { Route } from './+types/team';
import { Site } from '../components/Site';
import { PageHead } from '../components/PageHead';
import { AgentCard } from '../components/AgentCard';
import { agentOf, siteData } from '../lib/data.server';
import { href, langOfPath, teamSlug } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './team.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const { org, teams, agents } = await siteData();
  return {
    l,
    orgName: org.name,
    cities: joinList(teams.map((x) => cityName(x.address.city, l)).filter(Boolean), l),
    agents: agents.map(agentOf),
    teams: teams.map(({ id, name, address, phone }) => ({ id, name, address, phone, slug: teamSlug({ id, name, address }, teams) })),
  };
}

export default function Team({ loaderData: { l, orgName, cities, agents, teams } }: Route.ComponentProps) {
  const t = tx(l);
  const groups = teams.map((tm) => ({ team: tm, agents: agents.filter((a) => a.team_ids.includes(tm.id)) })).filter((g) => g.agents.length);
  const others = agents.filter((a) => !teams.some((tm) => a.team_ids.includes(tm.id)));
  const C = {
    en: { title: 'Our team', lede: `${agents.length} agents in ${cities}. Write or call the office of the area you are looking at.`, office: 'Office page' },
    fr: { title: 'Notre équipe', lede: `${agents.length} agents à ${cities}. Écrivez ou appelez le bureau du secteur qui vous intéresse.`, office: 'Page du bureau' },
  }[l];
  return (
    <Site l={l} route="team" title={`${C.title} | ${orgName}`} description={C.lede}>
      <PageHead crumbLabel={t('breadcrumb')} crumbs={[{ label: t('home'), href: href('home', l) }, { label: t('navTeam') }]} title={C.title} lede={C.lede} />
      {groups.map((g) => (
        <section key={g.team.id} className="wrap grp">
          <header className="grp__head">
            <h2 className="h3">{cityName(g.team.address.city, l) || g.team.name}</h2>
            <p className="grp__meta">
              {g.team.phone && <a className="num" href={tel(g.team.phone)}>{g.team.phone}</a>}
              <a href={href('offices', l, g.team.slug)}>{C.office}</a>
            </p>
          </header>
          <ul className="plain agents">{g.agents.map((a) => <li key={a.id}><AgentCard agent={a} all={agents} teams={teams} l={l} /></li>)}</ul>
        </section>
      ))}
      {others.length > 0 && (
        <section className="wrap grp"><ul className="plain agents">{others.map((a) => <li key={a.id}><AgentCard agent={a} all={agents} teams={teams} l={l} /></li>)}</ul></section>
      )}
      <div className="pad"></div>
    </Site>
  );
}
