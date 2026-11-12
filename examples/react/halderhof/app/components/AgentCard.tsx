/**
 * One adviser: portrait (when the data has one), name linking to the agent
 * page, role or office, languages, direct line and e-mail in plain type.
 */
import type { Agent, Team } from '@realadvisor/sites-sdk/types';
import { Portrait } from './Portrait';
import { agentSlug, href, type L } from '../lib/routes';
import { cityName, langNames, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './AgentCard.css';

type Props = { agent: Agent; agents: Pick<Agent, 'id' | 'first_name' | 'last_name'>[]; teams: Team[]; l: L; as?: 'h2' | 'h3'; compact?: boolean };

export function AgentCard({ agent: a, agents, teams, l, as: H = 'h3', compact = false }: Props) {
  const t = tx(l);
  const team = teams.find((x) => a.team_ids.includes(x.id));
  const role = a.title ?? (team ? t('adviserAt', { city: cityName(team.address.city, l) || team.name }) : undefined);
  const langs = langNames(a.languages, l);
  const page = href('team', l, agentSlug(a, agents));
  return (
    <article className={['ag', compact && 'ag--compact'].filter(Boolean).join(' ')}>
      {a.photo?.url && (
        <a className="ag__photo" href={page} tabIndex={-1} aria-hidden="true">
          <Portrait agent={a} w={compact ? 160 : 480} sizes={compact ? '80px' : '(min-width: 1320px) 300px, (min-width: 760px) 23vw, 46vw'} />
        </a>
      )}
      <div className="ag__body">
        <H className="ag__name"><a href={page}>{a.first_name} {a.last_name}</a></H>
        {role && <p className="ag__role">{role}</p>}
        {langs && <p className="ag__langs"><span className="sr-only">{t('languages')}: </span>{langs}</p>}
        <ul className="ag__contact plain-list">
          {a.phone && <li><a className="num" href={tel(a.phone)}>{a.phone}</a></li>}
          {a.email && <li><a href={`mailto:${a.email}`}>{a.email}</a></li>}
        </ul>
      </div>
    </article>
  );
}
