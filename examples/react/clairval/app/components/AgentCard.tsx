/**
 * One agent: a 4:5 portrait when the data has a photo (no initials
 * fallback), name, role or office, languages, phone and e-mail in plain
 * type. `compact`: square portrait beside the text (listing sidebar).
 */
import type { Agent, Team } from '@realadvisor/sites-sdk/types';
import { Img } from './Img';
import { agentSlug, href, type L } from '../lib/routes';
import { cityName, languages, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './AgentCard.css';

type NamedAgent = Pick<Agent, 'id' | 'first_name' | 'last_name'>;
type Props = {
  agent: Agent;
  all: NamedAgent[];
  teams: Pick<Team, 'id' | 'name' | 'address'>[];
  l: L;
  compact?: boolean;
  as?: 'h2' | 'h3';
  /** Link the name to the agent page (default true). */
  link?: boolean;
};

export function AgentCard({ agent: a, all, teams, l, compact = false, as: H = 'h3', link = true }: Props) {
  const t = tx(l);
  const team = teams.find((x) => a.team_ids.includes(x.id));
  const role = a.title ?? (team ? `${l === 'fr' ? 'Bureau de' : ''} ${cityName(team.address.city, l) || team.name}${l === 'en' ? ' office' : ''}`.trim() : undefined);
  const langs = languages(a.languages, l);
  const name = `${a.first_name} ${a.last_name}`;
  const url = href('team', l, agentSlug(a, all));
  return (
    <article className={compact ? 'agent agent--compact' : 'agent'}>
      {a.photo && (
        <a className="agent__photo" href={link ? url : undefined} tabIndex={link ? -1 : undefined} aria-hidden={link ? 'true' : undefined}>
          {compact
            ? <Img src={a.photo} alt={a.photo.alt || name} width={240} height={240} sizes="88px" widths={[180, 240]} />
            : <Img src={a.photo} alt={a.photo.alt || name} width={640} height={800} sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw" widths={[400, 640, 900]} />}
        </a>
      )}
      <div className="agent__body">
        <H className="agent__name">{link ? <a href={url}>{name}</a> : name}</H>
        {role && <p className="agent__role">{role}</p>}
        {langs && <p className="agent__langs"><span className="sr-only">{t('speaks')}: </span>{langs}</p>}
        <ul className="agent__contact plain">
          {a.phone && <li><a className="num" href={tel(a.phone)}>{a.phone}</a></li>}
          {a.email && <li><a className="agent__email" href={`mailto:${a.email}`} title={a.email}>{a.email}</a></li>}
        </ul>
      </div>
    </article>
  );
}
