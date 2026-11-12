/** Coloured page head: eyebrow, big h1, optional lead and children for figures or actions. */
import type { ReactNode } from 'react';
import './PageHead.css';

type Props = { title: string; eyebrow?: string; lead?: string; tone?: 'zinnober' | 'lilac' | 'butter' | 'ink' | 'sand'; children?: ReactNode };

export function PageHead({ title, eyebrow, lead, tone = 'zinnober', children }: Props) {
  return (
    <section className={`ph ph--${tone}`}>
      <div className="wrap ph-in">
        <div className="ph-text">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
        </div>
        {children && <div className="ph-aside">{children}</div>}
      </div>
    </section>
  );
}
