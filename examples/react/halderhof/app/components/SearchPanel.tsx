/**
 * Hero search on the dark green panel: Kaufen / Mieten as two pills (a radio
 * group; the matching form shows through CSS :has, no JavaScript), then town,
 * type and budget as GET filters to the kit search pages. Options and the
 * count on the button come from the listings.
 */
import { Select } from '@realadvisor/sites-kit-react/components/form/Select';
import type { Listing } from '@realadvisor/sites-sdk/types';
import { href, type L } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { formatAmount, typeLabel } from '../lib/format';
import './SearchPanel.css';

export type PanelListing = Pick<Listing, 'price' | 'property_type'> & { address: Pick<Listing['address'], 'city'> };

export function SearchPanel({ l, buy, rent }: { l: L; buy: PanelListing[]; rent: PanelListing[] }) {
  const t = tx(l);
  const cityOpts = (xs: PanelListing[]) => {
    const m = new Map<string, number>();
    for (const x of xs) if (x.address.city) m.set(x.address.city, (m.get(x.address.city) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c, n]) => ({ value: c, label: `${cityName(c, l)} (${n})` }));
  };
  const typeOpts = (xs: PanelListing[]) => [...new Set(xs.map((x) => x.property_type.split('_')[0]!))].map((g) => ({ value: g, label: typeLabel(g, l) }));
  const steps = (xs: PanelListing[], candidates: number[]) => {
    const p = xs.map((x) => x.price ?? 0).filter((n) => n > 0);
    const min = Math.min(...p), max = Math.max(...p);
    return candidates.filter((c) => c > min && c < max).map((c) => ({ value: String(c), label: formatAmount(c) }));
  };
  const panels = [
    { id: 'buy', label: t('navBuy'), list: buy, action: href('buy', l), prices: steps(buy, [1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000]) },
    { id: 'rent', label: t('navRent'), list: rent, action: href('rent', l), prices: steps(rent, [2_000, 3_000, 4_000]) },
  ].filter((p) => p.list.length > 0);
  if (!panels.length) return null;
  return (
    <div className="sp">
      {panels.length > 1 && (
        <fieldset className="sp__tabs">
          <legend className="sr-only">{t('searchIntent')}</legend>
          {panels.map((p, i) => (
            <label key={p.id} className="sp__tab"><input type="radio" name="sp-intent" value={p.id} id={`sp-${p.id}`} defaultChecked={i === 0} /><span>{p.label}</span></label>
          ))}
        </fieldset>
      )}
      {panels.map((p) => (
        <form key={p.id} className={['sp__panel', `sp__panel--${p.id}`, panels.length === 1 && 'sp__panel--only'].filter(Boolean).join(' ')} method="get" action={p.action} role="search" aria-label={p.label}>
          <Select id={`sp-${p.id}-city`} label={t('where')} name="city" placeholder={t('allPlaces')} options={cityOpts(p.list)} />
          <Select id={`sp-${p.id}-type`} label={t('type')} name="propertyType" placeholder={t('allTypes')} options={typeOpts(p.list)} />
          {p.prices.length > 0 && <Select id={`sp-${p.id}-price`} label={t('budget')} name="maxPrice" placeholder={t('anyBudget')} options={p.prices} />}
          <button className="button button--light sp__go" type="submit">{t('showN', { n: p.list.length })}</button>
        </form>
      ))}
    </div>
  );
}
