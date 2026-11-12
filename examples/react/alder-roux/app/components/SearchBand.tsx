/**
 * Home search band: Buy / Rent / New / Sell tabs over the search. The tabs
 * are a radio group (arrow keys move between them) and the panels follow
 * in CSS (:has), so it works with zero JavaScript. Buy and Rent are GET
 * forms to the search pages with the kit's search params; options and
 * counts come from the listings.
 */
import { Select } from '@realadvisor/sites-kit-react/components/form/Select';
import type { Development, Listing } from '@realadvisor/sites-sdk/types';
import { href, type L } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { formatAmount, typeLabel } from '../lib/format';
import './SearchBand.css';

type Props = { l: L; buy: Listing[]; rent: Listing[]; developments: Development[] };

export function SearchBand({ l, buy, rent, developments }: Props) {
  const t = tx(l);
  const cityOpts = (xs: Listing[]) => {
    const m = new Map<string, number>();
    for (const x of xs) if (x.address.city) m.set(x.address.city, (m.get(x.address.city) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c, n]) => ({ value: c, label: `${cityName(c, l)} (${n})` }));
  };
  const typeOpts = (xs: Listing[]) => {
    const groups = [...new Set(xs.map((x) => x.property_type.split('_')[0]!))];
    return groups.map((g) => ({ value: g, label: typeLabel(g, l) }));
  };
  const steps = (xs: Listing[], candidates: number[]) => {
    const max = Math.max(0, ...xs.map((x) => x.price ?? 0));
    const min = Math.min(Infinity, ...xs.map((x) => x.price ?? Infinity));
    return candidates.filter((c) => c > min && c < max).map((c) => ({ value: String(c), label: formatAmount(c) }));
  };
  const panels = [
    { id: 'buy', label: t('tabBuy'), list: buy, action: href('buy', l), prices: steps(buy, [1_000_000, 1_500_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000]) },
    { id: 'rent', label: t('tabRent'), list: rent, action: href('rent', l), prices: steps(rent, [2_500, 3_000, 3_500, 4_000, 5_000]) },
  ].filter((p) => p.list.length > 0);
  const unitsAvailable = developments.reduce((a, d) => a + d.stats.available, 0);
  const first = panels[0]?.id ?? (developments.length ? 'new' : 'sell');
  return (
    <div className="sb">
      <fieldset className="sb__tabs">
        <legend className="sr-only">{t('searchIntent')}</legend>
        {panels.map((p) => (
          <label key={p.id} className="sb__tab"><input type="radio" name="sb-intent" value={p.id} id={`sb-${p.id}`} defaultChecked={p.id === first} /><span>{p.label}</span></label>
        ))}
        {developments.length > 0 && <label className="sb__tab"><input type="radio" name="sb-intent" value="new" id="sb-new" defaultChecked={first === 'new'} /><span>{t('tabNew')}</span></label>}
        <label className="sb__tab"><input type="radio" name="sb-intent" value="sell" id="sb-sell" defaultChecked={first === 'sell'} /><span>{t('tabSell')}</span></label>
      </fieldset>

      {panels.map((p) => (
        <form key={p.id} className={`sb__panel sb__panel--${p.id}`} method="get" action={p.action} role="search" aria-label={p.label}>
          <Select id={`sb-${p.id}-city`} label={t('where')} name="city" placeholder={t('allPlaces')} options={cityOpts(p.list)} />
          <Select id={`sb-${p.id}-type`} label={t('type')} name="propertyType" placeholder={t('allTypes')} options={typeOpts(p.list)} />
          {p.prices.length > 0 && <Select id={`sb-${p.id}-price`} label={t('budget')} name="maxPrice" placeholder={t('anyBudget')} options={p.prices} />}
          <button className="button button--light sb__go" type="submit">{t('searchN', { n: p.list.length })}</button>
        </form>
      ))}
      {developments.length > 0 && (
        <div className="sb__panel sb__panel--new sb__panel--text">
          <p>{t(developments.length === 1 ? 'newPanel' : 'newPanelPlural', { n: developments.length, units: unitsAvailable })}</p>
          <a className="button button--light" href={developments.length === 1 ? href('developments', l, developments[0]!.slug) : href('developments', l)}>{t('seeDevelopments')}</a>
        </div>
      )}
      <div className="sb__panel sb__panel--sell sb__panel--text">
        <p>{t('sellPanel')}</p>
        <a className="button button--light" href={href('sell', l)}>{t('valuationCta')}</a>
      </div>
    </div>
  );
}
