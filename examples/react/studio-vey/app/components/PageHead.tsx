/** Page opening: h1, lede. */
import type { ReactNode } from 'react';
import './PageHead.css';

export function PageHead({ title, lede, sync = false, children }: { title: string; lede?: string; sync?: boolean; children?: ReactNode }) {
  return (
    <header className="ph wrap">
      <h1 className="h1 ph-title" data-rs-sync={sync ? 'h1' : undefined}>{title}</h1>
      {lede && <p className="lede ph-lede">{lede}</p>}
      {children}
    </header>
  );
}
