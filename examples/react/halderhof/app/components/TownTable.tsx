/** Towns of a region: counts for sale and to rent, asking-price span, each linking to the filtered search. */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { priceSpan } from '../lib/regions';
import { href, type L } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { formatAmount } from '../lib/format';
import './TownTable.css';

/** A town with what the table reads of its listings. */
export type TownRow = { city: string; buy: Pick<Listing, 'price' | 'price_on_request'>[]; rent: unknown[] };

export function TownTable({ l, towns, caption }: { l: L; towns: TownRow[]; caption: string }) {
  const t = tx(l);
  const rows = towns.filter((x) => x.buy.length + x.rent.length > 0);
  if (!rows.length) return null;
  return (
    <table className="tt">
      <caption className="sr-only">{caption}</caption>
      <thead><tr><th scope="col">{t('colPlace')}</th><th scope="col" className="n">{t('colBuy')}</th><th scope="col" className="n">{t('colRent')}</th><th scope="col" className="p">{t('colPrices')}</th></tr></thead>
      <tbody>
        {rows.map((x) => {
          const span = priceSpan(x.buy);
          const q = `?city=${encodeURIComponent(x.city)}`;
          return (
            <tr key={x.city}>
              <th scope="row">{cityName(x.city, l)}</th>
              <td className="n num">{x.buy.length ? <a href={`${href('buy', l)}${q}`}>{x.buy.length}</a> : '–'}</td>
              <td className="n num">{x.rent.length ? <a href={`${href('rent', l)}${q}`}>{x.rent.length}</a> : '–'}</td>
              <td className="p num">{span ? t('pricesFromTo', { from: formatAmount(span.min), to: formatAmount(span.max) }) : x.buy[0]?.price ? formatAmount(x.buy[0].price) : '–'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
