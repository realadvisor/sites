/** Team: every advisor, grouped by office, with phone and email links. */
import type { Route } from './+types/team';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { AgentCard } from '../components/AgentCard';
import { siteData } from '../lib/data.server';
import { agentSlug, href, langOf, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import './team.css';

export async function loader({ request }: Route.LoaderArgs) {
  const { org, teams, agents } = await siteData();
  return { l: langOf(new URL(request.url).pathname), name: org.name, teams, agents };
}

export default function Page({ loaderData: { l, name, teams, agents } }: Route.ComponentProps) {
  const t = tx(l);
  const groups = teams.map((tm) => ({ team: tm, agents: agents.filter((a) => a.team_ids.includes(tm.id)) })).filter((g) => g.agents.length);
  const loose = agents.filter((a) => !teams.some((tm) => a.team_ids.includes(tm.id)));
  return (
    <Layout l={l} route="team" title={`${t('teamTitle')} | ${name}`} description={t('teamLede', { n: agents.length, offices: teams.length })}>
      <section className="band on-navy">
        <div className="wrap band__inner">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navTeam') }]} />
          <h1 className="h1">{t('teamTitle')}</h1>
          <p className="lede">{t('teamLede', { n: agents.length, offices: teams.length })}</p>
          {groups.length > 1 && (
            <nav className="jump" aria-label={t('navOffices')}>
              {groups.map((g) => <a key={g.team.id} href={`#${teamSlug(g.team, teams)}`}>{cityName(g.team.address.city, l) || g.team.name} <span className="num">{g.agents.length}</span></a>)}
            </nav>
          )}
        </div>
      </section>
      <div className="wrap section groups">
        {groups.map((g) => (
          <section key={g.team.id} className="grp" id={teamSlug(g.team, teams)} aria-labelledby={`h-${g.team.id}`}>
            <div className="grp__head">
              <h2 className="h2" id={`h-${g.team.id}`}>{cityName(g.team.address.city, l) || g.team.name}</h2>
              <a className="link" href={href('offices', l, teamSlug(g.team, teams))}>{t('visitOffice')}</a>
            </div>
            <ul className="plain-list grid grid--3">
              {g.agents.map((a) => <li key={a.id}><AgentCard agent={a} slug={agentSlug(a, agents)} team={g.team} l={l} /></li>)}
            </ul>
          </section>
        ))}
        {loose.length > 0 && (
          <ul className="plain-list grid grid--3">{loose.map((a) => <li key={a.id}><AgentCard agent={a} slug={agentSlug(a, agents)} l={l} as="h2" /></li>)}</ul>
        )}
      </div>
    </Layout>
  );
}
