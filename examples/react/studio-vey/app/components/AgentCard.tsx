/** Agent in plain type: name, role, languages, phone and e-mail, link to their page. */
import type { Agent } from '@realadvisor/sites-sdk/types';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { agentUrl } from '../lib/urls';
import { fullName, languages, telHref } from '../lib/format';
import './AgentCard.css';

type Props = { agent: Agent; count?: number; layout?: 'stack' | 'row'; link?: boolean; as?: 'h2' | 'h3' | 'p' };

export function AgentCard({ agent, count, layout = 'stack', link = true, as: H = 'h3' }: Props) {
  const langs = languages(agent.languages);
  const row = layout === 'row';
  const name = fullName(agent);
  // 4:5 portrait cut from the square photo; stack = column width of the 4/2/1-up grids, row = 88px thumbnail.
  const box = row ? { width: 176, height: 220, sizes: '88px' } : { width: 640, height: 800, sizes: '(min-width: 560px) 248px, 320px' };
  const photo = agent.photo && <RaImage src={agent.photo.url} alt={name} {...box} />;
  return (
    <article className={['agent', `agent--${layout}`, agent.photo && 'agent--photo'].filter(Boolean).join(' ')}>
      {agent.photo && <div className="agent-photo">{link ? <a href={agentUrl(agent)} tabIndex={-1}>{photo}</a> : photo}</div>}
      <div className="agent-body">
        <H className="agent-name">{link ? <a href={agentUrl(agent)}>{name}</a> : name}</H>
        {agent.title && <p className="agent-title caps muted">{agent.title}</p>}
        {langs && <p className="agent-langs muted">{langs}</p>}
        <ul className="agent-contact">
          {agent.phone && <li><a href={telHref(agent.phone)}>{agent.phone}</a></li>}
          {agent.email && <li><a href={`mailto:${agent.email}`} title={agent.email}>{agent.email}</a></li>}
        </ul>
        {link && count != null && count > 0 && <a className="more agent-more" href={agentUrl(agent)}>{count === 1 ? '1 Objekt' : `${count} Objekte`}</a>}
      </div>
    </article>
  );
}
