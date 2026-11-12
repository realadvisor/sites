/** Team: every agent, grouped by agency, as name, role, languages, phone and e-mail (portrait when set). */
import type { Route } from './+types/equipe';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { AgentBlock } from '../components/AgentBlock';
import { siteData } from '../lib/data.server';
import { teamHref, teamShortName } from '../lib/site';
import './equipe.css';

export async function loader() {
  const { org, teams, agents } = await siteData();
  return {
    brand: org.name.replace(/\s+SAS$/, ''),
    nTeams: teams.length,
    nAgents: agents.length,
    groups: teams.map((t) => ({ team: t, people: agents.filter((a) => a.team_ids.includes(t.id)) })).filter((g) => g.people.length),
  };
}

export default function Page({ loaderData: { brand, nTeams, nAgents, groups } }: Route.ComponentProps) {
  return (
    <Layout nav="team" title={`L'équipe | ${brand}`} description={`Les ${nAgents} agents ${brand} dans nos ${nTeams} agences : téléphone, e-mail et langues parlées.`}>
      <PageHead title="L'équipe" lede={`${nAgents} agents dans ${nTeams} agences. Appelez directement celui ou celle de votre secteur.`} />
      <div className="wrap groups">
        {groups.map(({ team, people }) => (
          <section key={team.id} className="group" aria-labelledby={`g-${team.id}`}>
            <div className="group__head">
              <h2 id={`g-${team.id}`} className="h3">{teamShortName(team)}</h2>
              <p className="muted">{team.address.city} · <a className="link" href={teamHref(team)}>L'agence</a></p>
            </div>
            <ul className="people">{people.map((a) => <li key={a.id}><AgentBlock agent={a} /></li>)}</ul>
          </section>
        ))}
      </div>
    </Layout>
  );
}
