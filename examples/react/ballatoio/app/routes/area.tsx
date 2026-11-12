/** One district: a photo, the agency's text on it, its homes for sale, to rent and sold. */
import type { Route } from './+types/area';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { img } from '@realadvisor/sites-kit/image';
import { Site } from '../components/Site';
import { ListingCard } from '../components/ListingCard';
import { Photo } from '../components/Photo';
import { Prose } from '../components/Prose';
import { agency, cardOf, sites } from '../lib/data.server';
import { brandName, byNewest } from '../lib/data';
import { districtsWithListings } from '../lib/districts';
import { placePhotos } from '../lib/places';
import { districtText } from '../content/content.server';
import { UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import './area.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const ui = UI[lang];
  const [ag, all] = await Promise.all([agency(), sites.allListings()]);
  const withListings = districtsWithListings(all);
  const d = withListings.find((x) => x.slug === params.slug);
  if (!d) throw notFound();
  const mine = [...d.listings].sort(byNewest);
  const sale = mine.filter((l) => l.status === 'available' && l.offer_type === 'buy');
  const rent = mine.filter((l) => l.status === 'available' && l.offer_type === 'rent');
  const sold = mine.filter((l) => l.status === 'sold');
  const places = placePhotos(d.place, lang);
  const listingPhoto = (sale[0] ?? rent[0] ?? sold[0])?.photos[0];
  const name = d.name;
  return {
    lang,
    brand: brandName(ag),
    slug: d.slug,
    name,
    text: districtText(d.slug, lang),
    hero: places[0] ?? listingPhoto,
    second: places[1],
    sections: [
      { id: 'sale', title: fill(ui.areaForSale, { name }), list: sale.map(cardOf), price: true },
      { id: 'rent', title: fill(ui.areaToRent, { name }), list: rent.map(cardOf), price: true },
      { id: 'sold', title: fill(ui.areaSold, { name }), list: sold.map(cardOf), price: false },
    ].filter((s) => s.list.length > 0),
    others: withListings.filter((x) => x.slug !== d.slug).map((o) => ({ slug: o.slug, name: o.name })),
  };
}

export default function AreaPage({ loaderData: { lang, brand, slug, name, text, hero, second, sections, others } }: Route.ComponentProps) {
  const ui = UI[lang];
  return (
    <Site lang={lang} current="areas" title={`${fill(ui.areaHomes, { name })} | ${brand}`}
      description={text?.lead ?? fill(ui.areaHomes, { name })}
      image={hero && img(hero.url, { w: 1200, h: 630 })} alternates={alternates('areas', slug)}>
      <header className="wrap phead head">
        <p className="small"><a className="back" href={href('areas', lang)}><span aria-hidden="true">←</span> {ui.nav.areas}</a></p>
        <h1 className="d-mega">{name}</h1>
        {text && <p className="lead">{text.lead}</p>}
      </header>
      {hero && (
        <div className="wrap">
          <div className="frame hero"><Photo src={hero} alt={hero.alt || name} width={1600} height={800} priority quality={55} widths={[640, 960, 1280, 1600, 1920]} sizes="(min-width: 1520px) 1424px, 100vw" mobile={{ width: 800, height: 640 }} /></div>
        </div>
      )}
      {text && (
        <section className="wrap text">
          <Prose blocks={text.body} />
          {second && <div className="frame text-photo"><Photo src={second} alt={second.alt} width={800} height={1000} sizes="(min-width: 900px) 30vw, 100vw" /></div>}
        </section>
      )}

      {sections.length ? sections.map((s) => (
        <section key={s.id} className="wrap homes" aria-labelledby={`h-${s.id}`}>
          <h2 id={`h-${s.id}`} className="d-l">{s.title}</h2>
          <div className="grid">{s.list.map((l) => <ListingCard key={l.id} listing={l} lang={lang} showPrice={s.price} />)}</div>
        </section>
      )) : (
        <section className="wrap homes">
          <p className="lead">{fill(ui.areaNone, { name })}</p>
          <p><a className="cta cta-solid" href={href('contact', lang)}>{ui.areaAsk}</a></p>
        </section>
      )}

      {others.length > 0 && (
        <nav className="wrap others" aria-labelledby="others-h">
          <h2 id="others-h" className="label muted">{ui.otherAreas}</h2>
          <ul>{others.map((o) => <li key={o.slug}><a className="d-m" href={href('areas', lang, o.slug)}>{o.name}</a></li>)}</ul>
        </nav>
      )}
    </Site>
  );
}
