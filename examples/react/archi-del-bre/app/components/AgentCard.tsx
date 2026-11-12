/**
 * One agent: a real portrait (square crop through the image helper) when the
 * API has `photo`, else name, role, languages, phone and e-mail in plain type.
 * No initials, no stock portrait.
 */
import type { Agent } from '@realadvisor/sites-sdk/types';
import { Photo } from './Photo';
import { tel, type L } from '../lib/routes';
import { c, languageNames } from '../lib/copy';
import './AgentCard.css';

export function AgentCard({ agent: a, l, role, className }: { agent: Agent; l: L; role?: string; className?: string }) {
  const name = `${a.first_name} ${a.last_name}`.trim();
  const langs = languageNames(a.languages, l);
  return (
    <div className={['agent', 'c-agent', className, a.photo?.url && 'has-photo'].filter(Boolean).join(' ')}>
      {a.photo?.url && (
        <Photo className="portrait" src={a.photo.url} alt={a.photo.alt || name} width={400} height={400} sizes="(max-width: 640px) 30vw, 160px" widths={[240, 400, 600]} />
      )}
      <div className="body">
        <p className="name">{name}</p>
        {(a.title || role) && <p className="role">{a.title || role}</p>}
        <dl>
          {langs && <div><dt>{c('languages', l)}</dt><dd>{langs}</dd></div>}
          {a.phone && <div><dt>{c('phone', l)}</dt><dd><a href={tel(a.phone)} className="num">{a.phone}</a></dd></div>}
          {a.email && <div><dt>{c('email', l)}</dt><dd><a href={`mailto:${a.email}`}>{a.email}</a></dd></div>}
        </dl>
      </div>
    </div>
  );
}
