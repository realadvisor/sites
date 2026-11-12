/**
 * Buy and rent in one section. Without JavaScript both panels show one after
 * the other, each with its own heading; offerTabs() in app/client.ts turns
 * them into ARIA tabs (arrow keys, Home/End) and hides the inactive panel.
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { ListingCard } from './ListingCard';
import './OfferTabs.css';

export type Panel = { key: string; label: string; heading: string; total: number; listings: Listing[]; href: string; linkLabel: string };

const n = (x: number) => (x === 1 ? '1 Objekt' : `${x} Objekte`);

export function OfferTabs({ title, panels }: { title: string; panels: Panel[] }) {
  const shown = panels.filter((p) => p.listings.length > 0);
  if (shown.length === 0) return null;
  return (
    <section className="ot section" aria-labelledby="ot-title" data-offer-tabs="">
      <div className="wrap">
        <header className="ot-head">
          <h2 className="h2" id="ot-title">{title}</h2>
          {shown.length > 1 && (
            <div className="ot-tabs" role="tablist" aria-labelledby="ot-title" hidden data-tablist="">
              {shown.map((p, i) => (
                <button key={p.key} type="button" role="tab" id={`ot-tab-${p.key}`} aria-controls={`ot-panel-${p.key}`} aria-selected={i === 0 ? 'true' : 'false'} tabIndex={i === 0 ? 0 : -1}>
                  {p.label} <span className="num">{p.total}</span>
                </button>
              ))}
            </div>
          )}
        </header>
        {shown.map((p) => (
          <div key={p.key} className="ot-panel" id={`ot-panel-${p.key}`} aria-labelledby={`ot-h-${p.key}`} data-panel="">
            <div className="ot-sub">
              <h3 className="h3 ot-h" id={`ot-h-${p.key}`}>{p.heading} <span className="muted num">{n(p.total)}</span></h3>
            </div>
            <ul className="ot-grid">{p.listings.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
            <p className="ot-more"><a className="more" href={p.href}>{p.linkLabel}</a></p>
          </div>
        ))}
      </div>
    </section>
  );
}
