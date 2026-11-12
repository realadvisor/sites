/**
 * A broker: portrait (4:5, square corners like the site's cards, only when the
 * agent has a photo), then name, role, languages, phone, e-mail in plain type.
 */
import type { Agent } from '@realadvisor/sites-sdk/types';
import { BucketPhoto } from './BucketPhoto';
import { tel } from '../lib/nav';
import './AgentContact.css';

const LANG: Record<string, string> = { fr: 'français', en: 'anglais', de: 'allemand', it: 'italien', es: 'espagnol' };

export function AgentContact({ agent, org, tone = 'light' }: { agent: Agent; org?: string; tone?: 'light' | 'dark' }) {
  const langs = (agent.languages ?? []).map((l) => LANG[l] ?? l);
  const languages = langs.length ? `Parle ${langs.length > 1 ? `${langs.slice(0, -1).join(', ')} et ${langs.at(-1)}` : langs[0]}` : '';
  const name = `${agent.first_name} ${agent.last_name}`;
  const role = [agent.title ?? 'Commercialisation', org].filter(Boolean).join(', ');
  return (
    <div className={`agent ${tone}`}>
      {agent.photo && <div className="face"><BucketPhoto src={agent.photo.url} alt={name} width={1000} height={1000} widths={[120, 240, 360]} fallbackWidth={240} sizes="120px" position="50% 25%" /></div>}
      <p className="n">{name}</p>
      <p className="r">{role}</p>
      {languages && <p className="r">{languages}</p>}
      <p className="links">
        {agent.phone && <a href={tel(agent.phone)}>{agent.phone}</a>}
        {agent.email && <a href={`mailto:${agent.email}`}>{agent.email}</a>}
      </p>
    </div>
  );
}
