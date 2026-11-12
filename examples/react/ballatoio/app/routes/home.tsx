/**
 * Home: a magazine cover (one listing, full bleed, the wordmark over it),
 * an index of what is on offer, the sale collection as a spread, the
 * districts as a photo and a typographic list, rentals as plain rows, the
 * valuation split and the journal as a list.
 */
import type { Route } from './+types/home';
import { agencyOf } from '@realadvisor/sites-kit-core/agency';
import { img } from '@realadvisor/sites-kit-core/image';
import { agencyJsonLd } from '@realadvisor/sites-kit-core/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Site } from '../components/Site';
import { ListingCard } from '../components/ListingCard';
import { Photo } from '../components/Photo';
import { agency, cardOf, sites } from '../lib/data.server';
import { brandName, byNewest } from '../lib/data';
import { districtsWithListings, inMilan, placeOf } from '../lib/districts';
import { placePhoto } from '../lib/places';
import { card, postsOf } from '../content/content.server';
import { CONTENT_LANG, UI, alternates, fill, href, langOfPath, listingHref } from '../lib/i18n';
import { factLine, formatDate, price } from '../lib/format';
import './home.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const ui = UI[lang];
  const [ag, all] = await Promise.all([agency(), sites.allListings()]);
  const live = all.filter((l) => l.status === 'available').sort(byNewest);
  const sale = live.filter((l) => l.offer_type === 'buy');
  const rent = live.filter((l) => l.offer_type === 'rent');
  const sold = all.filter((l) => l.status === 'sold').sort(byNewest);
  // The cover: the newest home for sale with at least three photos, else any with one.
  const cover = sale.find((l) => l.photos.length >= 3) ?? live.find((l) => l.photos[0]);
  const spread = sale.filter((l) => l.id !== cover?.id).slice(0, 5);
  return {
    lang,
    name: brandName(ag),
    intro: ag.team?.description_text,
    description: ag.team?.description_text?.slice(0, 158) ?? ui.heroSub,
    jsonLd: agencyJsonLd(agencyOf(ag.org, ag.team), new URL('/', siteUrl()).href),
    counts: { sale: sale.length, rent: rent.length, sold: sold.length },
    cover: cover && cardOf(cover),
    spread: spread.map(cardOf),
    rent: rent.slice(0, 4).map(cardOf),
    districts: districtsWithListings(all).map((d) => ({ slug: d.slug, name: d.name, n: d.listings.length })),
    outside: [...new Set(all.filter((l) => !inMilan(l) && l.address.city).map((l) => l.address.city!))],
    districtPhoto: placePhoto('navigli', lang, 0) ?? placePhoto('milano', lang, 0),
    sellPhoto: sold.find((l) => l.photos[0])?.photos[0] ?? placePhoto('brera', lang, 1),
    posts: postsOf(lang).slice(0, 4).map(card),
  };
}

export default function Home({ loaderData: d }: Route.ComponentProps) {
  const { lang, name, cover, counts } = d;
  const ui = UI[lang];
  const textLang = lang === CONTENT_LANG ? undefined : CONTENT_LANG;
  const [lead, ...rest] = d.spread;
  const homes = (n: number) => (n === 1 ? ui.homeOne : fill(ui.homesN, { n }));
  const index = [
    counts.sale > 0 && { label: ui.nav.buy, n: homes(counts.sale), href: href('buy', lang) },
    counts.rent > 0 && { label: ui.nav.rent, n: homes(counts.rent), href: href('rent', lang) },
    counts.sold > 0 && { label: ui.nav.sold, n: homes(counts.sold), href: href('sold', lang) },
    { label: ui.nav.sell, n: '', href: href('sell', lang) },
  ].filter(Boolean) as { label: string; n: string; href: string }[];
  const { districtPhoto, sellPhoto } = d;
  return (
    <Site lang={lang} title={`${name}, ${ui.heroSub}`} description={d.description}
      image={cover?.photos[0] && img(cover.photos[0].url, { w: 1200, h: 630 })}
      alternates={alternates('home')} jsonLd={d.jsonLd}>

      <section className="cover" data-hero="">
        {cover?.photos[0] && (
          <div className="cover-photo">
            <Photo src={cover.photos[0]} alt={cover.photos[0].alt || cover.title} width={1600} height={900} priority widths={[640, 960, 1280, 1600, 1920]} sizes="100vw" mobile={{ width: 800, height: 1100 }} />
          </div>
        )}
        <div className="cover-text on-dark">
          <div className="wrap cover-in">
            <h1>
              <span className="cover-sub">{ui.heroSub}</span>
              <span className="d-mega cover-mark">{name}</span>
            </h1>
            <div className="cover-actions">
              {counts.sale > 0 && <a className="cta cta-solid" href={href('buy', lang)}>{ui.heroBuy}</a>}
              <a className="cta cta-light" href={href('sell', lang)}>{ui.heroSell}</a>
            </div>
          </div>
        </div>
      </section>
      {cover && (
        <div className="wrap cover-caption">
          <p className="label muted">{ui.coverLabel}</p>
          <p><a href={listingHref(cover, lang)} lang={textLang}>{cover.title}</a></p>
          <p className="muted">{placeOf(cover)}</p>
          <p className="num">{price(cover, lang)}</p>
        </div>
      )}

      <section className="wrap intro">
        {d.intro && <p className="intro-text">{d.intro}</p>}
        <ul className="index">
          {index.map((i) => (
            <li key={i.href}><a href={i.href}><span className="d-l">{i.label}</span><span className="index-n">{i.n}</span><span aria-hidden="true" className="index-arrow">→</span></a></li>
          ))}
        </ul>
      </section>

      {lead && (
        <section className="wrap sale" aria-labelledby="sale-h">
          <h2 id="sale-h" className="d-xl">{ui.forSaleTitle}</h2>
          <ListingCard listing={lead} lang={lang} shape="wide" />
          {rest.length > 0 && (
            <div className="spread">
              {rest.map((l, i) => <ListingCard key={l.id} listing={l} lang={lang} shape={i % 3 === 0 ? 'tall' : 'land'} />)}
            </div>
          )}
          <p className="more"><a className="arrow-link" href={href('buy', lang)}>{fill(ui.seeAllSale, { n: counts.sale })} <span aria-hidden="true">→</span></a></p>
        </section>
      )}

      {d.districts.length > 0 && (
        <section className="areas" aria-labelledby="areas-h">
          {districtPhoto && (
            <div className="areas-photo frame">
              <Photo src={districtPhoto} alt={districtPhoto.alt} width={1800} height={760} sizes="100vw" mobile={{ width: 800, height: 900 }} />
            </div>
          )}
          <div className="wrap areas-in">
            <div className="areas-head">
              <h2 id="areas-h" className="d-xl">{ui.areasTitle}</h2>
              <p className="lead">{ui.areasLine}</p>
            </div>
            <ul className="areas-list">
              {d.districts.map((x) => (
                <li key={x.slug}><a href={href('areas', lang, x.slug)}><span className="d-l">{x.name}</span> <span className="areas-n num">{homes(x.n)}</span></a></li>
              ))}
            </ul>
            {d.outside.length > 0 && <p className="areas-out"><span className="label">{ui.outside}</span> {d.outside.join(', ')}</p>}
          </div>
        </section>
      )}

      {d.rent.length > 0 && (
        <section className="wrap rent" aria-labelledby="rent-h">
          <div className="rent-head">
            <h2 id="rent-h" className="d-xl">{ui.rentTitle}</h2>
            <a className="arrow-link" href={href('rent', lang)}>{ui.seeAllRent} <span aria-hidden="true">→</span></a>
          </div>
          <ul className="rows">
            {d.rent.map((l) => (
              <li key={l.id} className="row">
                <div className="frame row-photo">
                  {l.photos[0] && <Photo src={l.photos[0]} alt={l.photos[0].alt || l.title} width={480} height={360} sizes="(min-width: 760px) 240px, 34vw" />}
                </div>
                <h3 className="row-title"><a href={listingHref(l, lang)} lang={textLang}>{l.title}</a></h3>
                <p className="row-place muted">{placeOf(l)}</p>
                <p className="row-facts num">{factLine(l, lang)}</p>
                <p className="row-price num">{price(l, lang)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="wrap sell" aria-labelledby="sell-h">
        {sellPhoto && (
          <div className="frame sell-photo">
            <Photo src={sellPhoto} alt={sellPhoto.alt ?? ''} width={900} height={1100} sizes="(min-width: 900px) 46vw, 100vw" />
          </div>
        )}
        <div className="sell-text">
          <h2 id="sell-h" className="d-xl">{ui.sellTitle}</h2>
          <p className="lead">{ui.sellLead}</p>
          <p className="sell-actions">
            <a className="cta cta-solid" href={href('sell', lang)}>{ui.sellCta}</a>
            {counts.sold > 0 && <a className="arrow-link" href={href('sold', lang)}>{ui.soldLink} <span aria-hidden="true">→</span></a>}
          </p>
        </div>
      </section>

      {d.posts.length > 0 && (
        <section className="wrap journal" aria-labelledby="journal-h">
          <h2 id="journal-h" className="d-xl">{ui.journalTitle}</h2>
          <ol className="posts">
            {d.posts.map((p) => (
              <li key={p.id}>
                <p className="small muted"><time dateTime={p.date}>{formatDate(new Date(p.date), lang)}</time></p>
                <h3 className="d-m"><a href={href('journal', lang, p.path)}>{p.title}</a></h3>
                <p>{p.excerpt}</p>
              </li>
            ))}
          </ol>
          <p className="more"><a className="arrow-link" href={href('journal', lang)}>{ui.journalAll} <span aria-hidden="true">→</span></a></p>
        </section>
      )}
    </Site>
  );
}
