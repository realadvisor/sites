/** Frame for the kit's legal text: title left, sections right. */
import type { ReactNode } from 'react';
import './LegalPage.css';

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="lg wrap">
      <header className="lg-head"><h1 className="h1">{title}</h1></header>
      <div className="lg-body">{children}</div>
    </div>
  );
}
