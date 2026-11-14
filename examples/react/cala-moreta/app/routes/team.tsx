import type { Route } from './+types/team';
import { Site } from '../components/Site';
import { AgentPortrait } from '../components/AgentPortrait';
import { agency, brandName, sites } from '../lib/data.server';
import { agentSlug } from '../lib/data';
import { UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import { languageList, telHref } from '../lib/format';
import './team.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, agents, all] = await Promise.all([agency(), sites.agents(), sites.allListings({ status: 'available' })]);
  const town = ag.team?.address.city ?? ag.org.address?.city ?? '';
  const counts = Object.fromEntries(agents.map((a) => [a.id, all.filter((l) => l.agent?.id === a.id).length]));
  return { lang, name: brandName(ag), town, agents, counts };
}

export default function Team({ loaderData: { lang, name, town, agents, counts } }: Route.ComponentProps) {
  const ui = UI[lang];
  const houses = (n: number) => (lang === 'es' ? (n === 1 ? '1 casa' : `${n} casas`) : n === 1 ? '1 house' : `${n} houses`);
  return (
    <Site lang={lang} current="team" title={`${ui.teamH1} | ${name}`} description={fill(ui.teamLead, { town, n: agents.length })} alternates={alternates('team')}>
      <header className="phead wrap">
        <h1 className="display-l">{ui.teamH1}</h1>
        <p className="lead">{fill(ui.teamLead, { town, n: agents.length })}</p>
      </header>
      <section className="wrap team">
        <ul className="agents">
          {agents.map((a, i) => {
            const n = counts[a.id] ?? 0;
            const url = href('team', lang, agentSlug(a));
            return (
              <li className="agent" key={a.id}>
                {a.photo?.url && (
                  <a className="agent-photo" href={url} tabIndex={-1} aria-hidden="true">
                    <AgentPortrait agent={a} sizes="(min-width: 961px) 28vw, 80vw" priority={i === 0} />
                  </a>
                )}
                <div className="agent-body">
                  <h2 className="agent-name"><a href={url}>{a.first_name} {a.last_name}</a></h2>
                  {a.title && <p className="agent-title">{a.title}</p>}
                  {a.languages?.length ? <p className="agent-meta">{ui.speaks} {languageList(a.languages, lang)}</p> : null}
                  {n > 0 && <p className="agent-meta">{houses(n)}</p>}
                  <p className="agent-contact">
                    {a.phone && <a className="num" href={telHref(a.phone)}>{a.phone}</a>}
                    {a.email && <a href={`mailto:${a.email}`} title={a.email}>{a.email}</a>}
                  </p>
                  <a className="link" href={url}>{ui.agentProfile} <span className="arrow" aria-hidden="true">→</span></a>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="band">
        <div className="wrap band-in">
          <h2 className="display-m">{ui.sellTitle}</h2>
          <p className="band-actions">
            <a className="cta cta-light" href={href('sell', lang)}>{ui.sellCta}</a>
            <a className="cta cta-light" href={href('contact', lang)}>{ui.writeUs}</a>
          </p>
        </div>
      </section>
    </Site>
  );
}
