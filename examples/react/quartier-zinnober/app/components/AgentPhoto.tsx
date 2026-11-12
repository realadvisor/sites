/**
 * Square agent portrait through the kit helper (img()/srcset()): AVIF and WebP
 * srcsets with a JPEG fallback. Renders nothing without a photo, so callers
 * keep the plain-text layout. The frame matches the site's cards.
 */
import type { CSSProperties } from 'react';
import { img, srcset } from '@realadvisor/sites-kit/image';
import type { Agent } from '@realadvisor/sites-sdk/types';
import './AgentPhoto.css';

export function AgentPhoto({ agent, size = 96, priority = false }: { agent: Agent; size?: number; priority?: boolean }) {
  const url = agent.photo?.url;
  if (!url) return null;
  const name = `${agent.first_name} ${agent.last_name}`;
  const widths = [size, size * 2, size * 3];
  const set = (format: 'avif' | 'webp' | 'jpg', quality: number) => srcset(url, widths, 1, { format, quality });
  const sizes = `${size}px`;
  return (
    <picture className="portrait" style={{ '--size': `${size}px` } as CSSProperties}>
      <source type="image/avif" srcSet={set('avif', 55)} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp', 72)} sizes={sizes} />
      <img
        src={img(url, { w: size * 2, h: size * 2, format: 'jpg', quality: 74 })}
        srcSet={set('jpg', 74)}
        sizes={sizes}
        alt={name}
        width={size}
        height={size}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
