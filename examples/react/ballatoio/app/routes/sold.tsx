/** Venduti / Sold: every sold listing, no prices, a way to ask for something similar. */
import type { Route } from './+types/sold';
import { img } from '@realadvisor/sites-kit/image';
import { Site } from '../components/Site';
import { ListingCard } from '../components/ListingCard';
import { agency, cardOf, sites } from '../lib/data.server';
import { brandName, byNewest, firstPhoto } from '../lib/data';
import { UI, alternates, href, langOfPath } from '../lib/i18n';
import './sold.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, sold] = await Promise.all([agency(), sites.allListings({ status: 'sold' })]);
  const list = sold.sort(byNewest).map(cardOf);
  return { lang, brand: brandName(ag), list, photo: firstPhoto(list) };
}

export default function Sold({ loaderData: { lang, brand, list, photo } }: Route.ComponentProps) {
  const ui = UI[lang];
  return (
    <Site lang={lang} current="sold" title={`${ui.soldH1} | ${brand}`} description={ui.soldLead}
      image={photo && img(photo.url, { w: 1200, h: 630 })} alternates={alternates('sold')} noindex={list.length === 0}>
      <header className="wrap phead">
        <h1 className="d-xl">{ui.soldH1}</h1>
        <p className="lead">{ui.soldLead}</p>
      </header>
      <div className="wrap">
        {list.length ? (
          <div className="grid">
            {list.map((l, i) => <ListingCard key={l.id} listing={l} lang={lang} showPrice={false} priority={i === 0} heading="h2" />)}
          </div>
        ) : <p className="lead">{ui.soldEmpty}</p>}
        <p className="after"><a className="cta cta-solid" href={href('contact', lang)}>{ui.soldCta}</a></p>
      </div>
    </Site>
  );
}
