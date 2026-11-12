/** Sell: what a valuation is, the valuation form, the offices, and recent sales from the data. */
import type { Route } from './+types/sell';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { Site } from '../components/Site';
import { PageHead } from '../components/PageHead';
import { Img } from '../components/Img';
import { ListingCard } from '../components/ListingCard';
import { cardOf, siteData, sites } from '../lib/data.server';
import { href, langOfPath, LOCALE } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './sell.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org, teams }, sold, forSale] = await Promise.all([siteData(), sites.allListings({ status: 'sold' }), sites.allListings({ status: 'available', offer_type: 'buy' })]);
  return {
    l,
    orgName: org.name,
    cities: joinList(teams.map((x) => cityName(x.address.city, l)).filter(Boolean), l),
    phones: teams.filter((x) => x.phone).map((x) => ({ id: x.id, city: x.address.city, phone: x.phone! })),
    photo: forSale.find((x) => x.photos[1])?.photos[1],
    sold: sold.slice(0, 3).map(cardOf),
  };
}

export default function Sell({ loaderData: { l, orgName, cities, phones, photo, sold } }: Route.ComponentProps) {
  const t = tx(l);
  const C = {
    en: {
      title: 'Sell with Clairval', lede: `A free valuation of your house or apartment in ${cities}, by the agent of the nearest office, after a visit.`,
      what: 'What you receive', items: ['A price range and the price we would advertise, with the sales and listings it is based on.', 'How we would present the house, and to which buyers.', 'The documents to gather before a sale.', 'Our fee, in writing.'],
      form: 'Ask for a valuation', formNote: 'Tell us the address, the type of property and when you would like to sell.',
      msg: 'I would like a valuation of my property. Address: \nType: \nTiming: ',
      call: 'Or call the office', recent: 'Recently sold',
    },
    fr: {
      title: 'Vendre avec Clairval', lede: `Une estimation gratuite de votre maison ou de votre appartement à ${cities}, par l’agent du bureau le plus proche, après une visite.`,
      what: 'Ce que vous recevez', items: ['Une fourchette de prix et le prix d’annonce que nous proposerions, avec les ventes et annonces sur lesquelles il repose.', 'La façon dont nous présenterions la maison, et à quels acheteurs.', 'Les documents à réunir avant une vente.', 'Nos honoraires, par écrit.'],
      form: 'Demander une estimation', formNote: 'Indiquez l’adresse, le type de bien et quand vous souhaitez vendre.',
      msg: 'Je souhaite une estimation de mon bien. Adresse : \nType : \nCalendrier : ',
      call: 'Ou appelez le bureau', recent: 'Vendus récemment',
    },
  }[l];
  const title = C.title.replace('Clairval', orgName.replace(/\s+SA$/, ''));
  return (
    <Site l={l} route="sell" title={`${title} | ${orgName}`} description={C.lede}>
      <PageHead crumbLabel={t('breadcrumb')} crumbs={[{ label: t('home'), href: href('home', l) }, { label: t('navSell') }]} title={title} lede={C.lede} />
      <section className="wrap grid">
        <div className="left">
          {photo && <Img src={photo} alt={photo.alt ?? ''} width={900} height={640} priority sizes="(min-width: 1024px) 40vw, 100vw" />}
          <h2 className="h3">{C.what}</h2>
          <ul className="plain list">{C.items.map((x) => <li key={x}>{x}</li>)}</ul>
          <h2 className="h3">{C.call}</h2>
          <ul className="plain phones">
            {phones.map((x) => <li key={x.id}><span>{cityName(x.city, l)}</span><a className="num" href={tel(x.phone)}>{x.phone}</a></li>)}
          </ul>
        </div>
        <div className="form" id="valuation-form">
          <h2 className="h3">{C.form}</h2>
          <p className="muted">{C.formNote}</p>
          <EnquiryForm id="valuation" contactReason="valuation" message={C.msg} locale={LOCALE[l]} />
        </div>
      </section>
      {sold.length > 0 && (
        <section className="on-paper recent">
          <div className="wrap">
            <h2 className="h2">{C.recent}</h2>
            <ul className="plain grid3">{sold.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
          </div>
        </section>
      )}
    </Site>
  );
}
