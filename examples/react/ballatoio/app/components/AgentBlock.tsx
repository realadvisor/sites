/**
 * One agent in plain type: name, role, languages, phone, e-mail. A real
 * portrait (4:5 crop through the image helper) only when the data has one;
 * never initials.
 */
import type { Agent } from '@realadvisor/sites-sdk/types';
import { Photo } from './Photo';
import { UI, fill, href, type Lang } from '../lib/i18n';
import { languageList, telHref } from '../lib/format';
import { agentName, agentSlug } from '../lib/data';
import './AgentBlock.css';

type Props = {
  agent: Agent;
  lang: Lang;
  /** Name as a heading of this level. */
  heading?: 'h1' | 'h2' | 'h3';
  /** Link the name to the agent page. */
  link?: boolean;
  /** Extra line under the contacts (e.g. number of homes). */
  note?: string;
  size?: 'l' | 'm';
  /** The page's LCP image (agent page). */
  priority?: boolean;
  /** Portrait sizes attribute when the layout differs from the default. */
  sizes?: string;
};

export function AgentBlock({ agent: a, lang, heading: H = 'h3', link = true, note, size = 'm', priority = false, sizes }: Props) {
  const ui = UI[lang];
  const name = agentName(a);
  const langs = languageList(a.languages, lang);
  return (
    <div className={['agent', `agent-${size}`, a.photo && 'has-photo'].filter(Boolean).join(' ')}>
      {a.photo && (
        <div className="frame agent-photo">
          <Photo src={a.photo} alt={a.photo.alt || name} width={480} height={600} priority={priority} sizes={sizes ?? (size === 'l' ? '(min-width: 600px) 220px, 80vw' : '120px')} />
        </div>
      )}
      <div className="agent-text">
        <H className="agent-name d-m">{link ? <a href={href('team', lang, agentSlug(a))}>{name}</a> : name}</H>
        {a.title && <p className="agent-role">{a.title}</p>}
        {langs && <p className="agent-langs muted">{ui.speaks} {langs}</p>}
        <p className="agent-contacts">
          {a.phone && <a className="num" href={telHref(a.phone)}>{a.phone}</a>}
          {a.email && <a href={`mailto:${a.email}`} aria-label={fill(ui.writeTo, { name: a.first_name })}>{a.email}</a>}
        </p>
        {note && <p className="agent-note small">{note}</p>}
      </div>
    </div>
  );
}
