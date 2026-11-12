/**
 * Home: navy search band (Buy / Rent / New / Sell) beside the lead listing,
 * a grid of six new listings, the development as a full-bleed photo with one
 * line, the offices as a plain list, area tiles, the valuation band (with the
 * link to the sales).
 */
import type { Route } from './+types/home';
import { useKit } from '@realadvisor/sites-kit-react/components/Document';
import { img } from '@realadvisor/sites-kit-core/image';
import { agencyJsonLd } from '@realadvisor/sites-kit-core/seo';
import { Layout } from '../components/Layout';
import { SearchBand } from '../components/SearchBand';
import { ListingCard } from '../components/ListingCard';
import { ValuationBand } from '../components/ValuationBand';
import { PlacePhoto } from '../components/PlacePhoto';
import { Img } from '../components/Img';
import { siteData, sites } from '../lib/data.server';
import { href, langOf, listingHref, teamSlug } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { formatAmount, formatSurface, monthYear, price, rooms, tel } from '../lib/format';
import { areasOf, officeFor } from '../lib/areas';
import { areaPlace, placeAlt } from '../content/places';
import './home.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOf(new URL(request.url).pathname);
  const [{ org, teams, agents, primary }, all, developments] = await Promise.all([siteData(), sites.allListings(), sites.developments()]);
  const available = all.filter((x) => x.status === 'available');
  const buy = available.filter((x) => x.offer_type === 'buy');
  const rent = available.filter((x) => x.offer_type === 'rent');
  // Featured: the newest listings with a full photo set, sales first. The
  // lead one is in the hero, the next six in the grid.
  const featured = [...buy, ...rent].filter((x) => x.photos.length >= 4);
  const lead = featured[0] ?? available[0];
  const others = [...featured.slice(1), ...available.filter((x) => !featured.includes(x))].slice(0, 6);
  const areas = areasOf(all).map((a) => {
    const office = officeFor(a.city, all.filter((x) => x.address.city === a.city), teams);
    return { ...a, officeCity: office?.address.city, n: available.filter((x) => x.address.city === a.city).length };
  });
  const offices = teams.map((x) => ({
    team: x,
    slug: teamSlug(x, teams),
    agents: agents.filter((a) => a.team_ids.includes(x.id)).length,
    listings: available.filter((y) => y.team_ids.includes(x.id)).length,
  }));
  return {
    l,
    org: { id: org.id, name: org.name, address: org.address },
    primary: primary && { phone: primary.phone, email: primary.email },
    cityList: teams.map((x) => x.address.city).filter((c): c is string => !!c),
    buy, rent, lead, others, developments, areas, offices,
    sold: all.filter((x) => x.status === 'sold').length,
  };
}

export default function Page({ loaderData: d }: Route.ComponentProps) {
  const { l, org, primary, buy, rent, lead, others, developments, areas, offices, sold } = d;
  const t = tx(l);
  const kit = useKit();
  const cityList = d.cityList.map((c) => cityName(c, l)).filter(Boolean);
  const cities = joinList(cityList, l);
  const leadPhoto = lead?.photos[0];
  const dev = developments[0];
  const devLine = dev && [
    dev.stats.units > 0 ? t('unitsAvailable', { n: dev.stats.available, t: dev.stats.units }) : '',
    dev.stats.price?.min ? t('priceFrom', { p: formatAmount(dev.stats.price.min) }) : '',
    dev.delivery_date ? `${t('delivery')} ${monthYear(dev.delivery_date, l)}` : '',
  ].filter(Boolean).join(' · ');
  const siteUrl = new URL(href('home', l), kit.siteUrl).href;
  const jsonLd = agencyJsonLd({ id: org.id, name: org.name, phone: primary?.phone, email: primary?.email, address: org.address }, siteUrl);
  return (
    <Layout l={l} route="home"
      title={`${org.name} · ${t('homeEyebrow')} · ${cityList.join(', ')}`}
      description={t('homeLede', { cities })}
      image={leadPhoto && img(leadPhoto.url, { w: 1200, h: 630 })}
      jsonLd={jsonLd}>

      <section className="hero on-navy">
        <div className="hero__copy">
          <span className="eyebrow">{t('homeEyebrow')}<span className="hero__cities"> · {cityList.join(' · ')}</span></span>
          <h1 className="hero__title">{cityList.length > 1 ? t('homeTitle', { from: cityList[0]!, to: cityList.at(-1)! }) : t('homeTitle1', { city: cityList[0] ?? '' })}</h1>
          <p className="lede">{t('homeLede', { cities })}</p>
          <SearchBand l={l} buy={buy} rent={rent} developments={developments} />
        </div>
        {lead && (
          <a className="hero__media" href={listingHref(lead, l)}>
            {leadPhoto && <Img src={leadPhoto} alt={leadPhoto.alt || lead.title} width={1200} height={1100} priority sizes="(min-width: 1440px) 640px, (min-width: 1025px) 45vw, 100vw" mobile={{ width: 800, height: 600 }} />}
            <span className="hero__cap">
              <span className="hero__cap-place">{cityName(lead.address.city, l)}</span>
              <span className="hero__cap-title">{lead.title}</span>
              <span className="hero__cap-meta num">{[rooms(lead.rooms, l), formatSurface(lead.living_surface), price(lead, l)].filter(Boolean).join(' · ')}</span>
            </span>
          </a>
        )}
      </section>

      {others.length > 0 && (
        <section className="section">
          <div className="wrap">
            <h2 className="h2 new__h">{t('featuredTitle')}</h2>
            <ul className="plain-list grid grid--3">
              {others.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}
            </ul>
            <p className="new__more">
              {buy.length > 0 && <a className="button button--ghost" href={href('buy', l)}>{t('seeAllBuy')} <span className="num">({buy.length})</span></a>}
              {rent.length > 0 && <a className="button button--ghost" href={href('rent', l)}>{t('seeAllRent')} <span className="num">({rent.length})</span></a>}
            </p>
          </div>
        </section>
      )}

      {dev && (
        <section className="dev on-navy">
          {dev.photos[0] && <Img src={dev.photos[0]} alt="" width={1920} height={900} sizes="100vw" mobile={{ width: 800, height: 900 }} />}
          <div className="dev__shade"></div>
          <div className="wrap dev__copy">
            <span className="eyebrow">{t('newBuild')} · {cityName(dev.address.city, l)}</span>
            <h2 className="h2"><a href={href('developments', l, dev.slug)}>{dev.title}</a></h2>
            {devLine && <p className="dev__line num">{devLine}</p>}
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap offices">
          <div className="offices__intro">
            <h2 className="h2">{t('officesTitleN', { cities })}</h2>
            <p className="offices__note">{t('officesNote')}</p>
          </div>
          <ul className="plain-list offices__list">
            {offices.map(({ team: x, slug, agents: nA, listings: nL }) => {
              const city = cityName(x.address.city, l) || x.name;
              return (
                <li key={x.id}>
                  <h3 className="offices__city"><a href={href('offices', l, slug)}>{city}</a></h3>
                  <address>
                    {x.address.street && <span>{x.address.street}</span>}
                    {(x.address.postcode || x.address.city) && <span>{[x.address.postcode, cityName(x.address.city, l)].filter(Boolean).join(' ')}</span>}
                  </address>
                  <p className="offices__meta num">
                    {x.phone && <a href={tel(x.phone)}>{x.phone}</a>}
                    <span>{[nA > 0 && (nA === 1 ? t('nAgent1') : t('nAgents', { n: nA })), nL > 0 && (nL === 1 ? t('nListing1') : t('nListings', { n: nL }))].filter(Boolean).join(' · ')}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {areas.length > 0 && (
        <section className="section section--paper">
          <div className="wrap">
            <h2 className="h2 areas__h">{t('areasTitle')}</h2>
            <ul className="plain-list areas">
              {areas.map((a) => {
                const place = areaPlace(a.city, a.officeCity);
                return (
                  <li key={a.slug}>
                    <a className="area" href={href('areas', l, a.slug)}>
                      {place && <PlacePhoto place={place} alt={placeAlt(place, l)} width={600} height={720} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 100vw" />}
                      <span className="area__txt">
                        <span className="area__name">{cityName(a.city, l)}</span>
                        <span className="area__n num">{a.n === 1 ? t('nListing1') : t('nListings', { n: a.n })}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <ValuationBand l={l} sold={sold} />
    </Layout>
  );
}
