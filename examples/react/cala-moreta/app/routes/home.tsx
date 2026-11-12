import type { Route } from './+types/home';
import { agencyOf } from '@realadvisor/sites-kit/agency';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { canonical } from '@realadvisor/sites-kit-react/server/kit';
import { Site } from '../components/Site';
import { AgentPortrait } from '../components/AgentPortrait';
import { ListingCard } from '../components/ListingCard';
import { Photo } from '../components/Photo';
import { PHOTOS, photoOg } from '../lib/photos';
import { agency, brandName, sites } from '../lib/data.server';
import { agentSlug, towns } from '../lib/data';
import { areasOf, card, postsOf } from '../content/content.server';
import { CONTENT_LANG, UI, alternates, fill, href, langOfPath, listingHref } from '../lib/i18n';
import { formatDate, languageList, price, surface, telHref } from '../lib/format';
import './home.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, all, agents] = await Promise.all([agency(), sites.allListings(), sites.agents()]);
  const areaTexts = areasOf(lang);
  const forSale = all.filter((l) => l.status === 'available' && l.offer_type === 'buy');
  const toRent = all.filter((l) => l.status === 'available' && l.offer_type === 'rent');
  const available = all.filter((l) => l.status === 'available');
  const areaList = towns(all).map((t) => ({ name: t.name, slug: t.slug, n: t.listings.length, photo: areaTexts.find((a) => a.id === `${lang}/${t.slug}`)?.photo ?? 'home' as const }));
  // Search: towns of the available listings per offer, with counts (the button shows the count).
  const townCounts = (offer: 'buy' | 'rent') => {
    const m = new Map<string, number>();
    for (const l of available) if (l.offer_type === offer && l.address.city) m.set(l.address.city, (m.get(l.address.city) ?? 0) + 1);
    return [...m].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  };
  return {
    lang,
    name: brandName(ag),
    jsonLd: agencyJsonLd(agencyOf(ag.org, ag.team), canonical(new URL(href('home', lang), request.url))),
    nSale: forSale.length,
    nRent: toRent.length,
    latest: forSale.slice(0, 6),
    rent: toRent.slice(0, 5),
    areaList,
    buyTowns: townCounts('buy'),
    rentTowns: townCounts('rent'),
    journal: postsOf(lang).slice(0, 3).map(card),
    agents,
  };
}

export default function Home({ loaderData: d }: Route.ComponentProps) {
  const { lang, name, nSale, nRent } = d;
  const ui = UI[lang];
  const hero = PHOTOS.home;
  const houses = lang === 'es' ? (n: number) => (n === 1 ? '1 casa' : `${n} casas`) : (n: number) => (n === 1 ? '1 house' : `${n} houses`);
  const description = `${name}: ${ui.heroLead}`.slice(0, 158);
  const textLang = lang === CONTENT_LANG ? undefined : CONTENT_LANG;
  return (
    <Site lang={lang} overlay title={`${name} · ${ui.heroTitle}`} description={description}
      image={photoOg(hero)} alternates={alternates('home')} jsonLd={d.jsonLd}>
      <section className="hero" data-hero="">
        <Photo photo={hero} lang={lang} priority decorative cover className="hero-img" />
        <div className="hero-in wrap">
          <h1 className="hero-title">{ui.heroTitle}</h1>
          <p className="hero-lead">{ui.heroLead}</p>
        </div>
      </section>

      {nSale + nRent > 0 && (
        <div className="search-band">
          <form className="search wrap" method="get" action={href(nSale ? 'buy' : 'rent', lang)} data-home-search=""
            data-buy={href('buy', lang)} data-rent={href('rent', lang)}>
            <fieldset className="search-offer">
              <legend>{ui.searchWhat}</legend>
              <div className="seg">
                {nSale > 0 && <label><input type="radio" name="offerType" value="buy" defaultChecked data-count={nSale} /><span>{ui.forSale}</span></label>}
                {nRent > 0 && <label><input type="radio" name="offerType" value="rent" defaultChecked={!nSale} data-count={nRent} /><span>{ui.toRent}</span></label>}
              </div>
            </fieldset>
            <label className="search-where">
              <span>{ui.searchWhere}</span>
              <span className="select">
                <select name="city" className="control" data-town="">
                  <option value="">{ui.anyTown}</option>
                  {d.buyTowns.map(([t, n]) => <option key={`b${t}`} value={t} data-offer="buy" data-count={n}>{t}</option>)}
                  {d.rentTowns.map(([t, n]) => <option key={`r${t}`} value={t} data-offer="rent" data-count={n} hidden={nSale > 0} disabled={nSale > 0}>{t}</option>)}
                </select>
              </span>
            </label>
            <button type="submit" className="cta cta-accent search-go" data-go="" data-label={ui.searchGo} data-houses={lang}>
              {fill(ui.searchGo, { n: houses(nSale || nRent) })}
            </button>
          </form>
        </div>
      )}

      {d.latest.length > 0 && (
        <section className="section wrap latest">
          <div className="section-head">
            <h2 className="display-l">{ui.latestForSale}</h2>
            <a className="link" href={href('buy', lang)}>{fill(ui.seeAllSale, { n: nSale })} <span className="arrow" aria-hidden="true">→</span></a>
          </div>
          <ul className="grid3">
            {d.latest.map((l) => <li key={l.id}><ListingCard listing={l} lang={lang} /></li>)}
          </ul>
        </section>
      )}

      {d.areaList.length > 0 && (
        <section className="areas wrap" aria-labelledby="areas-h">
          <h2 id="areas-h" className="display-m">{ui.areasTitle}</h2>
          <ul className="area-tiles">
            {d.areaList.slice(0, 4).map((a) => (
              <li key={a.slug} className="area-tile">
                <div className="area-photo"><Photo photo={PHOTOS[a.photo]} lang={lang} decorative sizes="(min-width: 1360px) 310px, (min-width: 760px) 23vw, 46vw" /></div>
                <h3 className="area-name"><a href={href('areas', lang, a.slug)}>{a.name}</a></h3>
                <p className="area-n num">{fill(ui.areaCount, { n: a.n })}</p>
              </li>
            ))}
          </ul>
          {d.areaList.length > 4 && <a className="link" href={href('areas', lang)}>{fill(ui.allAreas, { n: d.areaList.length })} <span className="arrow" aria-hidden="true">→</span></a>}
        </section>
      )}

      {d.rent.length > 0 && (
        <section className="section wrap rent" aria-labelledby="rent-h">
          <div className="rent-head">
            <h2 id="rent-h" className="display-m">{ui.rentTitle}</h2>
            <a className="link" href={href('rent', lang)}>{ui.seeAllRent} <span className="arrow" aria-hidden="true">→</span></a>
          </div>
          <ul className="rent-list">
            {d.rent.map((l) => (
              <li key={l.id}>
                <span className="rent-town">{l.address.city}</span>
                <a className="rent-title" href={listingHref(l, lang)} lang={textLang}>{l.title}</a>
                <span className="rent-facts">{[l.bedrooms ? `${l.bedrooms} ${lang === 'es' ? 'dorm.' : 'bed'}` : '', surface(l.living_surface)].filter(Boolean).join(' · ')}</span>
                <span className="rent-price num">{price(l, lang)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="sell">
        <div className="wrap sell-in">
          <h2 className="display-l">{ui.sellTitle}</h2>
          <p className="sell-lead">{ui.sellLead}</p>
          <a className="cta cta-light" href={href('sell', lang)}>{ui.sellCta}</a>
        </div>
      </section>

      <div className="section wrap closing">
        {d.journal.length > 0 && (
          <section aria-labelledby="journal-h">
            <div className="mini-head">
              <h2 id="journal-h" className="display-m">{ui.journalTitle}</h2>
              <a className="link" href={href('blog', lang)}>{ui.journalAll} <span className="arrow" aria-hidden="true">→</span></a>
            </div>
            <ul className="notes">
              {d.journal.map((p) => (
                <li key={p.id}>
                  <time className="num" dateTime={p.date}>{formatDate(p.date, lang)}</time>
                  <a href={href('blog', lang, p.path)}>{p.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {d.agents.length > 0 && (
          <section aria-labelledby="team-h">
            <div className="mini-head">
              <h2 id="team-h" className="display-m">{ui.teamTitle}</h2>
              <a className="link" href={href('team', lang)}>{ui.teamAll} <span className="arrow" aria-hidden="true">→</span></a>
            </div>
            <ul className="people">
              {d.agents.map((a) => (
                <li key={a.id}>
                  <AgentPortrait agent={a} sizes="(min-width: 961px) 22vw, (min-width: 561px) 40vw, 70vw" className="person-photo" />
                  <h3 className="person-name"><a href={href('team', lang, agentSlug(a))}>{a.first_name} {a.last_name}</a></h3>
                  {a.title && <p>{a.title}</p>}
                  {a.languages?.length ? <p className="muted">{ui.speaks} {languageList(a.languages, lang)}</p> : null}
                  {a.phone && <p><a className="num" href={telHref(a.phone)}>{a.phone}</a></p>}
                  {a.email && <p><a href={`mailto:${a.email}`}>{a.email}</a></p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Site>
  );
}
