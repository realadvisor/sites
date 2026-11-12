/**
 * Portrait of an adviser (agent.photo), cropped 4:5 by imgproxy like every
 * portrait of the site. Renders nothing without a photo. `size="card"` fills
 * its container (team list); `size="thumb"` is the small fixed portrait.
 */
import type { Agent } from '@realadvisor/sites-sdk/types';
import { Photo } from './Photo';
import './AgentPhoto.css';

type Props = { agent: Pick<Agent, 'first_name' | 'last_name' | 'photo'>; size?: 'card' | 'thumb' };

export function AgentPhoto({ agent, size = 'thumb' }: Props) {
  if (!agent.photo?.url) return null;
  const name = `${agent.first_name} ${agent.last_name}`.trim();
  const card = size === 'card';
  return (
    <div className={`agent-photo ap-${size}`}>
      <Photo
        src={agent.photo}
        alt={name}
        width={card ? 480 : 192}
        height={card ? 600 : 240}
        widths={card ? [320, 480, 640, 960] : [96, 192, 288]}
        sizes={card ? '(min-width: 1000px) 340px, (min-width: 600px) 45vw, 100vw' : '96px'}
      />
    </div>
  );
}
