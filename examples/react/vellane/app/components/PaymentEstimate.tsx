/**
 * Indicative monthly loan repayment for a listing for sale. Everything is an
 * assumption the visitor can change (down payment, rate, duration); the
 * default rate is a round example, not a market figure or an offer. The
 * server renders the default result, payment() in app/client.ts recomputes
 * on input. Excludes insurance, notary fees and agency fees; says so.
 */
import { formatAmount } from '@realadvisor/sites-kit/format';
import './PaymentEstimate.css';

const D = { down: 20, rate: 3.5, years: 20 };
const monthly = (p: number, down: number, rate: number, years: number) => {
  const loan = p * (1 - down / 100);
  const n = years * 12;
  const r = rate / 100 / 12;
  return r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
};

export function PaymentEstimate({ price, id = 'pay' }: { price: number; id?: string }) {
  const m = Math.round(monthly(price, D.down, D.rate, D.years));
  return (
    <section className="pay" id={id} aria-labelledby={`${id}-h`} data-pay="" data-price={price}>
      <div className="pay__head">
        <h3 id={`${id}-h`} className="pay__h">Mensualité estimée</h3>
        <p className="pay__out"><output data-pay-out="" htmlFor={`${id}-down ${id}-rate ${id}-years`} className="num">{formatAmount(m)}</output><span> / mois</span></p>
      </div>
      <p className="pay__note">Estimation indicative pour un prêt de <span className="num" data-pay-loan="">{formatAmount(Math.round(price * (1 - D.down / 100)))}</span>, à taux fixe, hors assurance emprunteur, frais de notaire et frais de garantie. Modifiez les hypothèses ci-dessous ; ce n'est pas une offre de prêt.</p>
      <div className="pay__fields">
        <label className="pay__f">
          <span>Apport (%)</span>
          <input id={`${id}-down`} name="down" type="number" inputMode="decimal" min="0" max="90" step="5" defaultValue={D.down} data-pay-in="" />
        </label>
        <label className="pay__f">
          <span>Taux annuel (%)</span>
          <input id={`${id}-rate`} name="rate" type="number" inputMode="decimal" min="0" max="15" step="0.1" defaultValue={D.rate} data-pay-in="" />
        </label>
        <label className="pay__f">
          <span>Durée (ans)</span>
          <input id={`${id}-years`} name="years" type="number" inputMode="numeric" min="5" max="30" step="1" defaultValue={D.years} data-pay-in="" />
        </label>
      </div>
    </section>
  );
}
