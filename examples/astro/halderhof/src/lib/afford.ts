/**
 * Affordability rule of thumb as Swiss banks apply it, simplified: 20 % own
 * funds, a notional 5 % interest on the whole mortgage, 1 % of the price a
 * year for running costs and upkeep, the share above two thirds of the price
 * repaid over 15 years, and the total at most one third of gross income.
 * Shared by the server render and the browser script (src/scripts/calc.ts).
 */
export const RULES = { rate: 0.05, upkeep: 0.01, firstRank: 2 / 3, years: 15, maxShare: 1 / 3, minOwn: 0.2 } as const;

export type Result = { mortgage: number; ltv: number; monthly: number; share: number; ownOk: boolean; ok: boolean };

export function afford(price: number, own: number, income: number): Result {
  const p = Math.max(0, price);
  const o = Math.min(Math.max(0, own), p);
  const mortgage = p - o;
  const yearly = mortgage * RULES.rate + p * RULES.upkeep + Math.max(0, mortgage - p * RULES.firstRank) / RULES.years;
  const share = income > 0 ? yearly / income : Infinity;
  const ownOk = p > 0 && o / p >= RULES.minOwn - 1e-9;
  return { mortgage, ltv: p > 0 ? mortgage / p : 0, monthly: yearly / 12, share, ownOk, ok: ownOk && share <= RULES.maxShare + 1e-9 };
}

/** Example inputs for a price: 20 % own funds and the income at which it is just affordable, rounded up. */
export function defaults(price: number) {
  const own = Math.round((price * RULES.minOwn) / 10_000) * 10_000;
  const yearly = afford(price, own, 1).monthly * 12;
  return { price, own, income: Math.ceil(yearly / RULES.maxShare / 10_000) * 10_000 };
}

export const group = (n: number) => new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(Math.round(n));
export const chf = (n: number) => `CHF ${new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(Math.round(n))}`;
export const pct = (n: number, locale: string) => (Number.isFinite(n) ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n * 100)} %` : '–');
