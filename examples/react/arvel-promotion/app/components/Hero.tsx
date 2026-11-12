/**
 * Full-bleed cinematic hero: one photo (the page's LCP), a deep scrim, a
 * large serif title, an optional plain subline and a figures row. `kicker` is
 * a small line of context above the title. `size="band"` is the shorter
 * version for inner pages. The photo drifts slowly on scroll (transform only,
 * off with reduced motion).
 */
import type { ReactNode } from 'react';
import { Photo } from './Photo';
import { BucketPhoto, type PhotoName } from './BucketPhoto';
import './Hero.css';

type Props = {
  photo?: string;
  /** A site photo (app/content/photos.ts) instead of a data photo: art direction. */
  local?: { name: PhotoName; position?: string };
  alt: string;
  kicker?: string;
  /** Programme status tag (data-status) shown above the title. */
  tag?: { label: string; status?: string };
  title: string;
  line?: string;
  facts?: { label: string; value: string }[];
  size?: 'full' | 'band';
  headingLevel?: 'h1' | 'p';
  children?: ReactNode;
};

export function Hero({ photo, local, alt, kicker, tag, title, line, facts = [], size = 'full', headingLevel = 'h1', children }: Props) {
  const H = headingLevel;
  const box = size === 'full' ? { width: 1600, height: 900, mobile: { width: 800, height: 1160 } } : { width: 1600, height: 700, mobile: { width: 800, height: 900 } };
  return (
    <section className={`hero hero--${size}`} data-hero="">
      <div className="hero-media">
        {local ? (
          <BucketPhoto name={local.name} alt={alt} position={local.position} priority sizes="100vw" />
        ) : photo ? (
          <Photo src={photo} alt={alt} width={box.width} height={box.height} mobile={box.mobile} priority sizes="100vw" widths={[640, 960, 1280, 1600, 2000]} />
        ) : (
          <div className="hero-noimg" aria-hidden="true"></div>
        )}
      </div>
      <div className="hero-scrim" aria-hidden="true"></div>
      <div className="hero-content">
        {tag?.label && <p className="hero-tag"><span className="tag" data-status={tag.status}>{tag.label}</span></p>}
        {kicker && <p className="hero-kicker">{kicker}</p>}
        <H className="hero-title">{title}</H>
        {line && <p className="hero-sub">{line}</p>}
        {children}
        {facts.length > 0 && (
          <dl className="hero-facts">
            {facts.map((f) => (
              <div key={f.label}><dt>{f.label}</dt><dd className="num">{f.value}</dd></div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
