/**
 * Affordability calculator (Swiss rules, stated assumptions, indicative).
 * Server-rendered with example inputs; a small bundled script
 * (app/calc.ts, loaded by app/client.ts only on a page with [data-calc])
 * recomputes on input. No market figures: the 5 % is the banks' notional rate, said so.
 */
import { afford, chf, defaults, group, pct } from '../lib/afford';
import { LOCALE, type L } from '../lib/routes';
import { tx } from '../lib/copy';
import './Affordability.css';

type Props = { l: L; price: number; id?: string; heading?: 'h2' | 'h3'; tone?: 'paper' | 'white' };

export function Affordability({ l, price, id = 'calc', heading: H = 'h2', tone = 'paper' }: Props) {
  const t = tx(l);
  const d = defaults(price);
  const r = afford(d.price, d.own, d.income);
  const locale = LOCALE[l];
  const f = (n: string) => `${id}-${n}`;
  const inputs: [string, string, number][] = [['price', t('calcPrice'), d.price], ['own', t('calcOwn'), d.own], ['income', t('calcIncome'), d.income]];
  return (
    <section className={`calc calc--${tone}`} aria-labelledby={f('h')} data-calc="" data-locale={locale}
      data-ok={t('calcOk')} data-no={t('calcNo')} data-own-low={t('calcOwnLow')}>
      <div className="calc__head">
        <H id={f('h')} className="calc__title">{t('calcTitle')}</H>
        <p className="calc__lede">{t('calcLede')}</p>
      </div>
      <div className="calc__grid">
        <div className="calc__inputs">
          {inputs.map(([n, label, v]) => (
            <div key={n} className="calc__field">
              <label htmlFor={f(n)}>{label}</label>
              <div className="calc__control"><span aria-hidden="true">CHF</span><input id={f(n)} name={n} type="text" inputMode="numeric" autoComplete="off" defaultValue={group(v)} /></div>
            </div>
          ))}
        </div>
        <div className="calc__out" aria-live="polite">
          <dl>
            <div><dt>{t('calcMortgage')}</dt><dd className="num" data-out="mortgage">{chf(r.mortgage)}</dd></div>
            <div><dt>{t('calcLtv')}</dt><dd className="num" data-out="ltv">{pct(r.ltv, locale)}</dd></div>
            <div><dt>{t('calcCosts')}</dt><dd className="num big" data-out="monthly">{chf(r.monthly)}</dd></div>
            <div><dt>{t('calcShare')}</dt><dd className="num" data-out="share">{pct(r.share, locale)}</dd></div>
          </dl>
          <p className="calc__verdict" data-out="verdict" data-state={r.ok ? 'ok' : 'no'}>{!r.ownOk ? t('calcOwnLow') : r.ok ? t('calcOk') : t('calcNo')}</p>
        </div>
        <div className="calc__notes">
          <p className="calc__k">{t('calcAssume')}</p>
          <ul>
            <li>{t('calcA1')}</li>
            <li>{t('calcA2')}</li>
            <li>{t('calcA3')}</li>
            <li>{t('calcA4')}</li>
          </ul>
          <p className="calc__note">{t('calcNote')}</p>
        </div>
      </div>
    </section>
  );
}
