/** Page heading: optional back link, h1, one lede line and room for actions. */
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import './PageHead.css';

export function PageHead({ title, lede, back, children }: { title: string; lede?: string; back?: { href: string; label: string }; children?: ReactNode }) {
  return (
    <header className="ph wrap">
      {back && <a className="ph__back" href={back.href}><Icon name="back" size={18} />{back.label}</a>}
      <h1 className="ph__h1">{title}</h1>
      {lede && <p className="ph__lede">{lede}</p>}
      {children}
    </header>
  );
}
