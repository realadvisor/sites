/**
 * One agent: a 4:5 portrait when `agent.photo` is set, else plain type only
 * (no initials, no placeholder). Name (linked to the agent page), role,
 * agency, languages, phone and e-mail.
 */
import type { Agent, Team } from '@realadvisor/sites-sdk/types';
import { RaImage } from './RaImage';
import { agentHref, agentName, languages, tel, teamShortName } from '../lib/site';
import './AgentBlock.css';

type Props = {
  agent: Pick<Agent, 'id' | 'first_name' | 'last_name' | 'phone' | 'email' | 'languages'> & Partial<Pick<Agent, 'photo' | 'title'>>;
  team?: Team;
  /** card: portrait above (grids); row: portrait left (contact cards). */
  layout?: 'card' | 'row';
  as?: 'h2' | 'h3' | 'p';
  link?: boolean;
};

export function AgentBlock({ agent: a, team, layout = 'card', as: H = 'h3', link = true }: Props) {
  const name = agentName(a);
  const langs = languages(a.languages);
  return (
    <div className={['ag', `ag--${layout}`, a.photo ? 'has-photo' : ''].filter(Boolean).join(' ')}>
      {a.photo && (
        <div className="ag__photo">
          <RaImage src={a.photo} alt={a.photo.alt || name} width={400} height={500} sizes={layout === 'row' ? '96px' : '(min-width: 960px) 280px, 45vw'} />
        </div>
      )}
      <div className="ag__body">
        <H className="ag__name">{link ? <a href={agentHref(a)}>{name}</a> : name}</H>
        {(a.title || team) && <p className="ag__role">{[a.title, team && `Vellane ${teamShortName(team)}`].filter(Boolean).join(' · ')}</p>}
        {langs && <p className="ag__langs">Parle {langs}</p>}
        <p className="ag__contact">
          {a.phone && <a href={tel(a.phone)} className="num">{a.phone}</a>}
          {a.email && <a href={`mailto:${a.email}`}>{a.email}</a>}
        </p>
      </div>
    </div>
  );
}
