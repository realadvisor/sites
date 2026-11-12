/** Valuation band: one line, one action, full width. */
import './ValuationBand.css';

export function ValuationBand({ href = '/verkaufen#bewertung', sold = 0, where = 'am See und in der Stadt' }: { href?: string; sold?: number; where?: string }) {
  return (
    <section className="val" aria-labelledby="val-title">
      <div className="wrap val-in">
        <h2 className="val-title h1" id="val-title">Was ist Ihre Immobilie wert?</h2>
        <p className="val-text">Wir sehen uns Ihr Haus oder Ihre Wohnung an und begründen unsere Einschätzung, unverbindlich und persönlich.{sold > 0 && <> Zuletzt haben wir {sold === 1 ? 'ein Objekt' : `${sold} Objekte`} {where} verkauft.</>}</p>
        <p className="val-actions"><a className="button button--solid" href={href}>Bewertung anfragen</a><a className="more" href="/verkauft">Verkaufte Objekte</a></p>
      </div>
    </section>
  );
}
