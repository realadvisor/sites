/**
 * Agent portrait through the image helper (4:5 or square crop). Renders
 * nothing when the agent has no photo: the name, role and contacts carry
 * the card then. No initials fallback.
 */
import type { Agent } from '@realadvisor/sites-sdk/types';
import { Img } from './Img';
import './Portrait.css';

type Props = { agent: Pick<Agent, 'first_name' | 'last_name' | 'photo'>; w: number; ratio?: 'portrait' | 'square'; sizes: string; className?: string; priority?: boolean };

export function Portrait({ agent, w, ratio = 'portrait', sizes, className, priority }: Props) {
  const h = ratio === 'square' ? w : Math.round((w * 5) / 4);
  if (!agent.photo?.url) return null;
  return (
    <Img className={['portrait', className].filter(Boolean).join(' ')} src={agent.photo} alt={agent.photo.alt || `${agent.first_name} ${agent.last_name}`} width={w} height={h} sizes={sizes} priority={priority}
      widths={[w, w * 2].filter((x) => x <= 1200)} />
  );
}
