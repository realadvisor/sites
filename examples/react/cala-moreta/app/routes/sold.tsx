import type { Route } from './+types/sold';
import { img } from '@realadvisor/sites-kit/image';
import { Site } from '../components/Site';
import { ListingCard } from '../components/ListingCard';
import { agency, brandName, sites } from '../lib/data.server';
import { UI, alternates, href, langOfPath } from '../lib/i18n';
import './sold.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, sold] = await Promise.all([agency(), sites.allListings({ status: 'sold' })]);
  return { lang, name: brandName(ag), sold };
}

export default function Sold({ loaderData: { lang, name, sold } }: Route.ComponentProps) {
  const ui = UI[lang];
  const first = sold.find((l) => l.photos[0])?.photos[0];
  return (
    <Site lang={lang} current="sold" title={`${ui.soldH1} | ${name}`} description={ui.soldLead}
      image={first && img(first.url, { w: 1200, h: 630 })} alternates={alternates('sold')}>
      <header className="phead wrap">
        <h1 className="display-l">{ui.soldH1}</h1>
        <p className="lead">{ui.soldLead}</p>
      </header>
      <section className="wrap sold">
        {sold.length > 0
          ? <ul className="grid3">{sold.map((l, i) => <li key={l.id}><ListingCard listing={l} lang={lang} heading="h2" priority={i === 0} /></li>)}</ul>
          : <p className="lead">{ui.soldEmpty}</p>}
        <p className="sold-cta"><a className="cta cta-sea" href={href('contact', lang)}>{ui.soldCta}</a></p>
      </section>
    </Site>
  );
}
