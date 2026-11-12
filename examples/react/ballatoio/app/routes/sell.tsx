/** Vendere / Sell: how a sale works with the agency, the valuation form, recent sales. */
import type { Route } from './+types/sell';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { img } from '@realadvisor/sites-kit-core/image';
import { Site } from '../components/Site';
import { ListingCard } from '../components/ListingCard';
import { Photo } from '../components/Photo';
import { agency, cardOf, sites } from '../lib/data.server';
import { brandName, byNewest } from '../lib/data';
import { placePhoto } from '../lib/places';
import { LOCALE_OF, UI, alternates, href, langOfPath } from '../lib/i18n';
import { telHref } from '../lib/format';
import './sell.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, sold] = await Promise.all([agency(), sites.allListings({ status: 'sold' })]);
  return {
    lang,
    brand: brandName(ag),
    recent: sold.sort(byNewest).slice(0, 3).map(cardOf),
    photo: placePhoto('milano', lang, 4),
    phone: ag.team?.phone,
  };
}

export default function Sell({ loaderData: { lang, brand, recent, photo, phone } }: Route.ComponentProps) {
  const ui = UI[lang];
  return (
    <Site lang={lang} current="sell" title={`${ui.sellH1} | ${brand}`} description={ui.sellIntro}
      image={photo && img(photo.url, { w: 1200, h: 630 })} alternates={alternates('sell')}>
      <header className="wrap phead sell-head">
        <h1 className="d-xl">{ui.sellH1}</h1>
        <p className="lead">{ui.sellIntro}</p>
      </header>

      {photo && (
        <div className="wrap">
          <div className="frame sell-photo">
            <Photo src={photo} alt={photo.alt} width={1600} height={800} priority widths={[640, 960, 1280, 1600, 1920]} sizes="(min-width: 1520px) 1424px, 100vw" mobile={{ width: 800, height: 900 }} />
          </div>
        </div>
      )}

      <section className="wrap steps" aria-labelledby="steps-h">
        <h2 id="steps-h" className="d-l">{ui.howTitle}</h2>
        <dl className="steps-list">
          {ui.steps.map(([k, v]) => <div key={k}><dt className="d-m">{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </section>

      <section id="valuation" className="valuation" aria-labelledby="val-h">
        <div className="wrap val-in">
          <div className="val-text">
            <h2 id="val-h" className="d-l">{ui.sellFormTitle}</h2>
            <p className="lead">{ui.sellFormLead}</p>
            {phone && <p><a className="arrow-link num" href={telHref(phone)}>{ui.call} {phone}</a></p>}
          </div>
          <EnquiryForm id="valuation-form" contactReason="valuation" locale={LOCALE_OF[lang]} message={ui.sellMessage} submitLabel={ui.sellSubmit} />
        </div>
      </section>

      {recent.length > 0 && (
        <section className="wrap recent" aria-labelledby="recent-h">
          <div className="recent-head">
            <h2 id="recent-h" className="d-l">{ui.recentSales}</h2>
            <a className="arrow-link" href={href('sold', lang)}>{ui.soldLink} <span aria-hidden="true">→</span></a>
          </div>
          <div className="recent-grid">
            {recent.map((l) => <ListingCard key={l.id} listing={l} lang={lang} showPrice={false} sizes="(min-width: 900px) 31vw, 100vw" />)}
          </div>
        </section>
      )}
    </Site>
  );
}
