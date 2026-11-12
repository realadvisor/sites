import type { Agent, Team } from '@realadvisor/sites-sdk/types';
import { Icon } from './Icon';
import { AgentPhoto } from './AgentPhoto';
import './ContactCard.css';

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
export const LANG: Record<string, string> = { de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', es: 'Spanisch' };

export function ContactCard({ agent, team }: { agent: Agent; team?: Pick<Team, 'name' | 'phone' | 'email'> }) {
  const phone = agent.phone ?? team?.phone;
  const email = agent.email ?? team?.email;
  const langs = agent.languages?.length ? agent.languages.map((l) => LANG[l] ?? l.toUpperCase()).join(', ') : '';
  return (
    <div className="card">
      <AgentPhoto agent={agent} size={104} />
      <div className="who">
        <p className="name">{agent.first_name} {agent.last_name}</p>
        <p className="role">{agent.title ?? 'Erstvermietung'}{team?.name ? `, ${team.name}` : ''}</p>
        {langs && <p className="role">Spricht {langs}</p>}
        <ul>
          {phone && <li><a href={tel(phone)}><Icon name="phone" size={18} /><span className="num">{phone}</span></a></li>}
          {email && <li><a href={`mailto:${email}`}><Icon name="mail" size={18} /><span>{email.split('@')[0]}<wbr />@{email.split('@')[1]}</span></a></li>}
        </ul>
      </div>
    </div>
  );
}
