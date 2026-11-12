/**
 * An agent's own photo (agent.photo, square head-and-shoulders), cropped 4:5
 * through the kit's image helper. Square corners like every photo on the site.
 * No photo: renders nothing, the plain-text layout stays.
 */
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import type { Agent } from '@realadvisor/sites-sdk/types';
import './AgentPortrait.css';

type Props = {
  agent: Pick<Agent, 'first_name' | 'last_name' | 'photo'>;
  /** Browser layout width per breakpoint. */
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function AgentPortrait({ agent, sizes, priority = false, className }: Props) {
  if (!agent.photo?.url) return null;
  return (
    <div className={['portrait', className].filter(Boolean).join(' ')}>
      <RaImage src={agent.photo} alt={`${agent.first_name} ${agent.last_name}`} width={800} height={1000}
        widths={[240, 400, 600, 800]} sizes={sizes} priority={priority} />
    </div>
  );
}
