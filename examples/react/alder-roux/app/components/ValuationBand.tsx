/** Full-width navy valuation band: one call to action, and the sales link when there are sales. */
import { href, type L } from '../lib/routes';
import { tx } from '../lib/copy';
import './ValuationBand.css';

export function ValuationBand({ l, sold = 0 }: { l: L; sold?: number }) {
  const t = tx(l);
  return (
    <section className="vb on-navy">
      <div className="wrap vb__in">
        <div className="vb__copy">
          <h2 className="h2">{t('valuationTitle')}</h2>
          <p className="lede">{t('valuationText')}</p>
        </div>
        <div className="vb__acts">
          <a className="button button--light" href={href('sell', l)}>{t('valuationCta')}</a>
          {sold > 0 && <a className="vb__sold" href={href('sold', l)}>{t('seeSoldN', { n: sold })}</a>}
        </div>
      </div>
    </section>
  );
}
