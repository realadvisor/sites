import type { Route } from './+types/area';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Site } from '../components/Site';
import { ListingCard } from '../components/ListingCard';
import { Photo } from '../components/Photo';
import { Markdown } from '../components/Markdown';
import { PHOTOS, photoOg } from '../lib/photos';
import { agency, brandName, sites } from '../lib/data.server';
import { towns } from '../lib/data';
import { areaText } from '../content/content.server';
import { UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import './area.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  // Area pages exist for every town with 2+ listings (any offer, any status).
  const all = towns(await sites.allListings());
  const town = all.find((t) => t.slug === params.town);
  if (!town) throw notFound();
  const ag = await agency();
  return {
    lang,
    name: brandName(ag),
    town: { name: town.name, slug: town.slug },
    forSale: town.listings.filter((l) => l.status === 'available' && l.offer_type === 'buy'),
    toRent: town.listings.filter((l) => l.status === 'available' && l.offer_type === 'rent'),
    sold: town.listings.filter((l) => l.status === 'sold'),
    others: all.filter((t) => t !== town).map((t) => ({ name: t.name, slug: t.slug })),
    text: areaText(lang, town.slug) ?? null,
  };
}

export default function AreaPage({ loaderData: { lang, name, town, forSale, toRent, sold, others, text } }: Route.ComponentProps) {
  const ui = UI[lang];
  const hero = PHOTOS[text?.photo ?? 'home'];
  const second = text?.photo2 ? PHOTOS[text.photo2] : undefined;
  const h1 = fill(ui.areaH1, { town: town.name });
  const searchHref = `${href(forSale.length || !toRent.length ? 'buy' : 'rent', lang)}?city=${encodeURIComponent(town.name)}`;
  return (
    <Site lang={lang} overlay current="areas" title={`${h1} | ${name}`} description={text?.tagline ? `${h1}: ${text.tagline}.` : h1}
      image={photoOg(hero)} alternates={alternates('areas', town.slug)}>
      <section className="ahero" data-hero="">
        <Photo photo={hero} lang={lang} priority cover landscapeAt="(min-width: 768px)" />
        <div className="wrap ahero-in">
          <p className="ahero-crumb"><a href={href('areas', lang)}>{ui.nav.areas}</a></p>
          <h1 className="display-xl">{h1}</h1>
          {text && <p className="ahero-tag">{text.tagline}</p>}
        </div>
      </section>

      <section className="wrap intro">
        {text && <div className="prose intro-text"><Markdown blocks={text.body} /></div>}
        <aside className="intro-facts">
          <dl>
            {forSale.length > 0 && <div><dt>{ui.forSale}</dt><dd className="num">{forSale.length}</dd></div>}
            {toRent.length > 0 && <div><dt>{ui.toRent}</dt><dd className="num">{toRent.length}</dd></div>}
            {sold.length > 0 && <div><dt>{ui.nav.sold}</dt><dd className="num">{sold.length}</dd></div>}
          </dl>
          <a className="cta cta-sea" href={searchHref}>{fill(ui.areaSearch, { town: town.name })}</a>
        </aside>
      </section>

      {second && (
        <figure className="scenery wrap">
          <div className="sc"><Photo photo={second} lang={lang} landscapeAt="(min-width: 761px)" sizes="(min-width: 1360px) 1232px, 100vw" /></div>
          <figcaption>{second.alt[lang]}</figcaption>
        </figure>
      )}

      {forSale.length + toRent.length > 0 && (
        <section className="section wrap">
          <div className="section-head">
            <div><h2 className="display-m">{fill(ui.areaHouses, { town: town.name })}</h2></div>
            <a className="link" href={searchHref}>{fill(ui.areaSearch, { town: town.name })} <span className="arrow" aria-hidden="true">→</span></a>
          </div>
          <ul className="grid3">{[...forSale, ...toRent].map((l) => <li key={l.id}><ListingCard listing={l} lang={lang} /></li>)}</ul>
        </section>
      )}
      {sold.length > 0 && (
        <section className="section wrap rest">
          <div className="section-head"><div><h2 className="display-m">{fill(ui.areaSold, { town: town.name })}</h2></div></div>
          <ul className="grid3">{sold.map((l) => <li key={l.id}><ListingCard listing={l} lang={lang} /></li>)}</ul>
        </section>
      )}
      {!forSale.length && !toRent.length && <p className="wrap lead none">{fill(ui.areaNone, { town: town.name })}</p>}

      {others.length > 0 && (
        <nav className="others" aria-label={ui.otherAreas}>
          <div className="wrap others-in">
            <h2 className="display-m">{ui.otherAreas}</h2>
            <ul>{others.map((o) => <li key={o.slug}><a href={href('areas', lang, o.slug)}>{o.name}</a></li>)}</ul>
          </div>
        </nav>
      )}
    </Site>
  );
}
