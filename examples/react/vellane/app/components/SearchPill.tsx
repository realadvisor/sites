/**
 * The home search: Acheter / Louer tabs over one rounded pill (où, type,
 * budget) that opens the split results view (cards beside the map). Plain
 * GET forms, one per offer type, switched by two radios with CSS only: it
 * works without JavaScript. Options come from the listings themselves, with
 * the same facets as the kit's search (typeGroup, priceSteps); the loader
 * computes them (searchPillForms). Clean URLs: searchPill() in app/client.ts.
 */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { priceSteps, typeGroup } from '@realadvisor/sites-kit-core/search';
import { formatAmount } from '@realadvisor/sites-kit-core/format';
import { R, typeLabel } from '../lib/site';
import { Icon } from './Icon';
import './SearchPill.css';

export type PillForm = { offer: 'buy' | 'rent'; n: number; cities: string[]; types: string[]; prices: number[] };

/** The forms' options, from the listings (server side: only the options reach the page). */
export function searchPillForms(listings: Listing[]): PillForm[] {
  const live = listings.filter((l) => l.status === 'available');
  const optionsFor = (offer: 'buy' | 'rent') => {
    const ls = live.filter((l) => l.offer_type === offer);
    const count = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
    const cities = count(ls.flatMap((l) => (l.address.city ? [l.address.city] : []))).map(([c]) => c).sort((a, b) => a.localeCompare(b, 'fr'));
    const types = count(ls.map((l) => typeGroup(l.property_type))).map(([t]) => t);
    const prices = priceSteps(ls.flatMap((l) => (l.price && !l.price_on_request ? [l.price] : [])), offer, 8);
    return { n: ls.length, cities, types, prices };
  };
  return (['buy', 'rent'] as const).map((offer) => ({ offer, ...optionsFor(offer) })).filter((f) => f.n > 0);
}

const amount = (n: number, offer: 'buy' | 'rent') => (offer === 'rent' ? `${formatAmount(n)} / mois` : formatAmount(n));

export function SearchPill({ forms }: { forms: PillForm[] }) {
  if (forms.length === 0) return null;
  return (
    <div className="sp">
      {forms.length > 1 && (
        <div className="sp__tabs" role="radiogroup" aria-label="Type de recherche">
          {forms.map((f, i) => (
            <label key={f.offer} className="sp__tab">
              <input type="radio" name="sp-offer" value={f.offer} defaultChecked={i === 0} className={`sp__radio sp__radio--${f.offer}`} />
              <span>{f.offer === 'buy' ? 'Acheter' : 'Louer'}</span>
            </label>
          ))}
        </div>
      )}
      {forms.map((f) => (
        <form key={f.offer} className={`sp__form sp__form--${f.offer}`} method="get" action={f.offer === 'buy' ? R.buy : R.rent} role="search"
          aria-label={f.offer === 'buy' ? 'Rechercher un bien à acheter' : 'Rechercher un bien à louer'}>
          <input type="hidden" name="view" value="map" />
          <label className="sp__field sp__field--where">
            <span className="sp__label">Où</span>
            <select name="city" defaultValue="">
              <option value="">Toutes les villes</option>
              {f.cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="sp__field">
            <span className="sp__label">Type de bien</span>
            <select name="propertyType" defaultValue="">
              <option value="">Tous les types</option>
              {f.types.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
            </select>
          </label>
          {f.prices.length > 0 && (
            <label className="sp__field">
              <span className="sp__label">Budget max.</span>
              <select name="maxPrice" defaultValue="">
                <option value="">Sans limite</option>
                {f.prices.map((p) => <option key={p} value={String(p)}>{amount(p, f.offer)}</option>)}
              </select>
            </label>
          )}
          <button className="sp__go" type="submit">
            <Icon name="search" size={20} stroke={2.25} />
            <span>Rechercher</span>
          </button>
        </form>
      ))}
    </div>
  );
}
