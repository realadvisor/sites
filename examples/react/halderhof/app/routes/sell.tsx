/**
 * Sell / valuation: the request form beside a short lede, how a valuation
 * runs (plain text), recent sales from the data, and the office to call.
 */
import type { Route } from './+types/sell';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { Site } from '../components/Site';
import { Crumbs } from '../components/Crumbs';
import { ListingCard } from '../components/ListingCard';
import { cardOf, siteData, sites } from '../lib/data.server';
import { href, langOfPath, LOCALE } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './sell.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org, teams }, sold] = await Promise.all([siteData(), sites.allListings({ status: 'sold' })]);
  return {
    l, orgName: org.name,
    phones: teams.filter((x) => x.phone).map((x) => ({ id: x.id, name: x.name, city: x.address.city, phone: x.phone! })),
    sold: sold.slice(0, 3).map(cardOf),
  };
}

export default function Sell({ loaderData: { l, orgName, phones, sold } }: Route.ComponentProps) {
  const t = tx(l);
  const steps = [
    [t('how1h'), t('how1')],
    [t('how2h'), t('how2')],
    [t('how3h'), t('how3')],
  ];
  return (
    <Site l={l} route="sell" title={`${t('sellTitle')} | ${orgName}`} description={t('sellLede')}>
      <section className="top on-green">
        <div className="wrap top__in">
          <div className="top__text">
            <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navSell') }]} />
            <h1 className="h1">{t('sellTitle')}</h1>
            <p className="lede">{t('sellLede')}</p>
            <ul className="plain-list phones">
              {phones.map((x) => (
                <li key={x.id}><span>{t('officeOf', { city: cityName(x.city, l) || x.name })}</span><a className="num" href={tel(x.phone)}>{x.phone}</a></li>
              ))}
            </ul>
          </div>
          <div className="top__form">
            <h2 className="h3">{t('valuationForm')}</h2>
            <EnquiryForm id="valuation" locale={LOCALE[l]} contactReason="valuation" message={t('valuationMessage')} submitLabel={t('valuationForm')} />
          </div>
        </div>
      </section>

      <section className="section wrap how" aria-labelledby="h-how">
        <h2 id="h-how" className="h2">{t('howTitle')}</h2>
        <dl>
          {steps.map(([h, p]) => <div key={h}><dt>{h}</dt><dd>{p}</dd></div>)}
        </dl>
      </section>

      {sold.length > 0 && (
        <section className="section section--paper" aria-labelledby="h-sold">
          <div className="wrap">
            <div className="head">
              <h2 id="h-sold" className="h2">{t('recentSales')}</h2>
              <a className="more" href={href('sold', l)}>{t('allSold')}</a>
            </div>
            <ul className="plain-list grid3">{sold.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
          </div>
        </section>
      )}
    </Site>
  );
}
