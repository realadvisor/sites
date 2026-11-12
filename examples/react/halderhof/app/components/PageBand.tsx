/** Green band under the header: breadcrumb, the page's h1, an optional lede and children. */
import type { ReactNode } from 'react';
import { Crumbs, type Crumb } from './Crumbs';
import { href, type L } from '../lib/routes';
import { tx } from '../lib/copy';

export function PageBand({ l, title, lede, crumbs, children }: { l: L; title: string; lede?: string; crumbs: Crumb[]; children?: ReactNode }) {
  const t = tx(l);
  return (
    <section className="band on-green">
      <div className="wrap band__inner">
        <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, ...crumbs]} />
        <h1 className="h1">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
        {children}
      </div>
    </section>
  );
}
