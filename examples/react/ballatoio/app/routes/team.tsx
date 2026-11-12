/** Team: every agent in plain type, with phone, e-mail and their homes. */
import type { Route } from './+types/team';
import { Site } from '../components/Site';
import { AgentBlock } from '../components/AgentBlock';
import { agency, sites } from '../lib/data.server';
import { brandName } from '../lib/data';
import { UI, alternates, fill, langOfPath } from '../lib/i18n';
import './team.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, agents, live] = await Promise.all([agency(), sites.agents(), sites.allListings({ status: 'available' })]);
  return { lang, brand: brandName(ag), agents: agents.map((a) => ({ agent: a, homes: live.filter((l) => l.agent?.id === a.id).length })) };
}

export default function Team({ loaderData: { lang, brand, agents } }: Route.ComponentProps) {
  const ui = UI[lang];
  const note = (n: number) => (n === 0 ? undefined : n === 1 ? ui.homesOfOne : fill(ui.homesOf, { n }));
  return (
    <Site lang={lang} current="team" title={`${ui.teamH1} | ${brand}`} description={fill(ui.teamLead, { n: agents.length })} alternates={alternates('team')}>
      <header className="wrap phead">
        <h1 className="d-xl">{ui.teamH1}</h1>
        <p className="lead">{fill(ui.teamLead, { n: agents.length })}</p>
      </header>
      <ul className="wrap team">
        {agents.map(({ agent: a, homes }) => (
          <li key={a.id}><AgentBlock agent={a} lang={lang} heading="h2" size="l" sizes="(min-width: 1080px) 340px, (min-width: 520px) 46vw, 300px" note={note(homes)} /></li>
        ))}
      </ul>
    </Site>
  );
}
