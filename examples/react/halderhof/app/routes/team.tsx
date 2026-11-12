/** Team: every adviser, grouped by office, with portrait, languages, direct line and e-mail. */
import type { Route } from './+types/team';
import { Site } from '../components/Site';
import { PageBand } from '../components/PageBand';
import { AgentCard } from '../components/AgentCard';
import { siteData } from '../lib/data.server';
import { href, langOfPath, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './team.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const { org, teams, agents } = await siteData();
  return { l, orgName: org.name, teams, agents };
}

export default function Team({ loaderData: { l, orgName, teams, agents } }: Route.ComponentProps) {
  const t = tx(l);
  const groups = teams.map((x) => ({ team: x, agents: agents.filter((a) => a.team_ids[0] === x.id) })).filter((g) => g.agents.length);
  const placed = new Set(groups.flatMap((g) => g.agents.map((a) => a.id)));
  const rest = agents.filter((a) => !placed.has(a.id));
  const offices = groups.length;
  return (
    <Site l={l} route="team" title={`${t('teamTitle')} | ${orgName}`} description={t('teamLede', { n: agents.length, offices })}>
      <PageBand l={l} title={t('teamTitle')} lede={t('teamLede', { n: agents.length, offices })} crumbs={[{ label: t('navTeam') }]} />
      <div className="wrap section groups">
        {groups.map((g) => {
          const city = cityName(g.team.address.city, l) || g.team.name;
          return (
            <section key={g.team.id} className="group" aria-labelledby={`h-${g.team.id}`}>
              <div className="group__head">
                <h2 id={`h-${g.team.id}`} className="h3"><a href={href('offices', l, teamSlug(g.team, teams))}>{t('officeOf', { city })}</a></h2>
                <p className="muted">{g.team.address.street}<br />{[g.team.address.postcode, cityName(g.team.address.city, l)].filter(Boolean).join(' ')}</p>
                {g.team.phone && <p><a className="num" href={tel(g.team.phone)}>{g.team.phone}</a></p>}
              </div>
              <ul className="plain-list cards">{g.agents.map((a) => <li key={a.id}><AgentCard agent={a} agents={agents} teams={teams} l={l} /></li>)}</ul>
            </section>
          );
        })}
        {rest.length > 0 && <ul className="plain-list cards">{rest.map((a) => <li key={a.id}><AgentCard agent={a} agents={agents} teams={teams} l={l} as="h2" /></li>)}</ul>}
      </div>
    </Site>
  );
}
