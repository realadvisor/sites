/**
 * Page opening on ivory: breadcrumb, h1, optional lede and children for links
 * or figures. Plain and left-aligned; no eyebrow.
 */
import type { ReactNode } from 'react';
import { Crumbs, type Crumb } from './Crumbs';
import './PageHead.css';

type Props = { crumbs?: Crumb[]; crumbLabel?: string; title: string; lede?: string; sync?: boolean; children?: ReactNode };

export function PageHead({ crumbs, crumbLabel = 'Breadcrumb', title, lede, sync = false, children }: Props) {
  return (
    <section className="ph">
      <div className="wrap">
        {crumbs && <Crumbs label={crumbLabel} items={crumbs} />}
        <h1 className="h1 ph__title" data-rs-sync={sync ? 'h1' : undefined}>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
        {children}
      </div>
    </section>
  );
}
