/** Title block of a page without a photo hero (legal, contact, 404). */
import type { ReactNode } from 'react';
import './PageHead.css';

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="phead">
      <div className="wrap">
        <h1 className="display">{title}</h1>
        {children}
      </div>
    </header>
  );
}
