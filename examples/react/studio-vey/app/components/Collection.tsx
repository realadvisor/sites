/** A collection: heading, three-up grid, "view all" link. */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { ListingCard } from './ListingCard';
import './Collection.css';

type Props = { id: string; label: string; title?: string; listings: Listing[]; href?: string; linkLabel?: string; tone?: 'plain' | 'tint' };

export function Collection({ id, label, title, listings, href, linkLabel = 'Alle ansehen', tone = 'plain' }: Props) {
  if (listings.length === 0) return null;
  return (
    <section className={['coll', `coll--${tone}`, tone === 'plain' && 'flow'].filter(Boolean).join(' ')} aria-labelledby={id}>
      <div className="wrap">
        <header className="coll-head">
          <div>
            {title && <h2 className="coll-title h2" id={id}>{title}</h2>}
            {!title && <h2 className="sr-only" id={id}>{label}</h2>}
          </div>
          {href && <a className="more" href={href}>{linkLabel}</a>}
        </header>
        <ul className="coll-grid">
          {listings.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}
        </ul>
      </div>
    </section>
  );
}
