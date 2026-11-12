/**
 * Sell: valuation request (the kit's EnquiryForm, reason "valuation") beside
 * the navy intro with the offices to call, the process as a plain list,
 * recent sales from the data.
 */
import type { Route } from './+types/sell';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { ListingCard } from '../components/ListingCard';
import { siteData, sites } from '../lib/data.server';
import { href, langOf, LOCALE, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import { SELL_STEPS } from '../content/pages';
import './sell.css';

export async function loader({ request }: Route.LoaderArgs) {
  const [{ org, teams }, sold] = await Promise.all([siteData(), sites.allListings({ status: 'sold' })]);
  return { l: langOf(new URL(request.url).pathname), name: org.name, teams, soldN: sold.length, sold: sold.slice(0, 3) };
}

export default function Page({ loaderData: { l, name, teams, soldN, sold } }: Route.ComponentProps) {
  const t = tx(l);
  const steps = SELL_STEPS[l];
  return (
    <Layout l={l} route="sell" title={`${t('sellTitle')} | ${name}`} description={t('sellLede')}>
      <section className="band on-navy">
        <div className="wrap sell">
          <div className="sell__copy">
            <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navSell') }]} />
            <h1 className="h1">{t('sellTitle')}</h1>
            <p className="lede">{t('sellLede')}</p>
            <ul className="offices">
              {teams.map((x) => (
                <li key={x.id}>
                  <a href={href('offices', l, teamSlug(x, teams))}>{cityName(x.address.city, l) || x.name}</a>
                  {x.phone && <a className="num" href={tel(x.phone)}>{x.phone}</a>}
                </li>
              ))}
            </ul>
          </div>
          <div className="sell__form" id="valuation">
            <h2 className="h3">{t('valuationForm')}</h2>
            <EnquiryForm id="valuation-form" locale={LOCALE[l]} contactReason="valuation" message={t('valuationMessage')} submitLabel={t('sendValuation')} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="how">
            <h2 className="h2">{t('howWeSell')}</h2>
            <ol className="steps">
              {steps.map((s) => <li key={s.title}><h3 className="steps__t">{s.title}</h3><p>{s.text}</p></li>)}
            </ol>
          </div>
        </div>
      </section>

      {soldN > 0 && (
        <section className="section section--paper">
          <div className="wrap">
            <div className="head">
              <h2 className="h2">{t('ourSales')}</h2>
              <a className="link" href={href('sold', l)}>{t('seeSold')} <span className="num">({soldN})</span></a>
            </div>
            <ul className="plain-list grid grid--3">{sold.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
          </div>
        </section>
      )}
    </Layout>
  );
}
