import type { Route } from './+types/sell';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { Site } from '../components/Site';
import { ListingCard } from '../components/ListingCard';
import { Photo } from '../components/Photo';
import { PHOTOS, photoOg } from '../lib/photos';
import { agency, brandName, sites } from '../lib/data.server';
import { LOCALE_OF, UI, alternates, href, langOfPath } from '../lib/i18n';
import { telHref } from '../lib/format';
import './sell.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, sold] = await Promise.all([agency(), sites.allListings({ status: 'sold' })]);
  return { lang, name: brandName(ag), phone: ag.team?.phone, sold: sold.slice(0, 3), anySold: sold.length > 0 };
}

export default function Sell({ loaderData: { lang, name, phone, sold, anySold } }: Route.ComponentProps) {
  const ui = UI[lang];
  const photo = PHOTOS.sell;
  return (
    <Site lang={lang} current="sell" title={`${ui.sellH1} | ${name}`} description={ui.sellIntro} image={photoOg(photo)} alternates={alternates('sell')}>
      <section className="split">
        <div className="split-text">
          <h1 className="display-l">{ui.sellH1}</h1>
          <p className="lead">{ui.sellIntro}</p>
          <a className="cta cta-accent" href="#valuation">{ui.sellCta}</a>
        </div>
        <div className="split-photo">
          <Photo photo={photo} lang={lang} decorative priority landscapeAt="(max-width: 900px)" sizes="(min-width: 900px) 50vw, 100vw" />
        </div>
      </section>

      <section className="section wrap" aria-labelledby="steps-h">
        <h2 id="steps-h" className="display-m steps-h">{ui.sellStepsTitle}</h2>
        <ol className="process">
          {ui.sellSteps.map(([word, line]) => (
            <li key={word}><span className="p-word">{word}</span><span className="p-line">{line}</span></li>
          ))}
        </ol>
      </section>

      <section className="val" id="valuation-section" aria-labelledby="val-h">
        <div className="wrap val-in">
          <div className="val-intro">
            <h2 id="val-h" className="display-m">{ui.sellFormTitle}</h2>
            <p className="lead">{ui.sellFormLead}</p>
            {phone && <p className="val-phone"><a className="num" href={telHref(phone)}>{phone}</a></p>}
          </div>
          <EnquiryForm id="valuation" contactReason="valuation" locale={LOCALE_OF[lang]} message={ui.sellMessage} submitLabel={ui.sellSubmit} />
        </div>
      </section>

      {anySold && (
        <section className="section wrap">
          <div className="section-head">
            <h2 className="display-m">{ui.recentSales}</h2>
            <a className="link" href={href('sold', lang)}>{ui.nav.sold} <span className="arrow" aria-hidden="true">→</span></a>
          </div>
          <ul className="grid3">{sold.map((l) => <li key={l.id}><ListingCard listing={l} lang={lang} /></li>)}</ul>
        </section>
      )}
    </Site>
  );
}
