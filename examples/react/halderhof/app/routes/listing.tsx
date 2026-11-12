/**
 * Listing page: serif title with the three key figures beside it, 1 + 4
 * gallery (a swipe strip with counters on the phone), anchor chips, facts,
 * description, features, energy label, every photo, approximate location,
 * the affordability calculator for a home for sale; the enquiry card with
 * the adviser sticks beside it. A unit of a development links back to it.
 */
import type { Route } from './+types/listing';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { listingIdFromSlug, sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { featureLabel, lang as klang, t as kt } from '@realadvisor/sites-kit/i18n';
import { listingJsonLd, listingRef, listingTitle } from '@realadvisor/sites-kit/seo';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { Crumbs } from '../components/Crumbs';
import { ListingCard } from '../components/ListingCard';
import { StaticMap } from '../components/StaticMap';
import { EnergyScale } from '../components/EnergyScale';
import { Portrait } from '../components/Portrait';
import { Affordability } from '../components/Affordability';
import { cardOf, extraNum, extraStr, siteData, sites } from '../lib/data.server';
import { agentSlug, href, langOfPath, LOCALE, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { dec, floor, formatAmount, formatSurface, price, tel, typeLabel } from '../lib/format';
import './listing.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const l = langOfPath(url.pathname);
  const slug = params.slug;
  const x = await sites.listing(slug);
  // A slug that ends with a listing id was a listing of this site: 410 Gone.
  if (!x) throw notFound(!!listingIdFromSlug(slug));
  const [{ teams, agents }, sameCity, devs] = await Promise.all([
    siteData(),
    x.address.city ? sites.allListings({ city: x.address.city }) : Promise.resolve([]),
    sites.developments(),
  ]);
  const full = await Promise.all(devs.map((d) => sites.development(d.slug)));
  const d = full.find((y) => y?.units.some((u) => u.listing_slug === x.slug)) ?? null;
  const agent = x.agent ? (agents.find((a) => a.id === x.agent!.id) ?? x.agent) : undefined;
  const team = teams.find((tm) => x.team_ids.includes(tm.id)) ?? teams.find((tm) => agent?.team_ids.includes(tm.id));
  const similar = sameCity.filter((y) => y.id !== x.id && y.status === 'available' && y.offer_type === x.offer_type).slice(0, 3).map(cardOf);
  const pageUrl = new URL(url.pathname, siteUrl()).href;
  return {
    l,
    x,
    title: `${listingTitle(x, sameCity)} | ${price(x, l)}`,
    jsonLd: listingJsonLd(x, pageUrl),
    dev: d && { slug: d.slug, title: d.title },
    agent: agent && { id: agent.id, first_name: agent.first_name, last_name: agent.last_name, phone: agent.phone, photo: agent.photo, slug: agentSlug(agent, agents) },
    team: team && { city: team.address.city, name: team.name, phone: team.phone, slug: teamSlug(team, teams) },
    similar,
    // fixture only: energy class, year built, floor, terrace / balcony surface, monthly charges
    ex: {
      energy: extraStr('listings', x.id, 'energy_class'),
      year: extraNum('listings', x.id, 'year_built'),
      floor: extraNum('listings', x.id, 'floor'),
      terrace: extraNum('listings', x.id, 'terrace_surface'),
      balcony: extraNum('listings', x.id, 'balcony_surface'),
      charges: extraNum('listings', x.id, 'charges'),
    },
  };
}

export default function ListingPage({ loaderData: { l, x, title, jsonLd, dev, agent, team, similar, ex } }: Route.ComponentProps) {
  const t = tx(l);
  const locale = LOCALE[l];
  const isRent = x.offer_type === 'rent';
  const sold = x.status === 'sold';
  const city = cityName(x.address.city, l);
  const { energy, year, floor: fl, terrace, balcony, charges } = ex;
  const facts = [
    x.rooms != null && { k: t('rooms'), v: dec(x.rooms, l) },
    x.bedrooms != null && { k: t('bedrooms'), v: String(x.bedrooms) },
    x.bathrooms != null && { k: t('bathrooms'), v: String(x.bathrooms) },
    x.living_surface != null && { k: t('livingArea'), v: formatSurface(x.living_surface) },
    x.land_surface != null && { k: t('landArea'), v: formatSurface(x.land_surface) },
    terrace != null && { k: t('terrace'), v: formatSurface(terrace) },
    balcony != null && { k: t('balcony'), v: formatSurface(balcony) },
    fl != null && { k: t('floor'), v: floor(fl, l) },
    year != null && { k: t('yearBuilt'), v: String(year) },
  ].filter(Boolean) as { k: string; v: string }[];
  const photos = x.photos;
  const back = isRent ? { label: t('navRent'), href: href('rent', l) } : sold ? { label: t('navSold'), href: href('sold', l) } : { label: t('navBuy'), href: href('buy', l) };
  const where = [x.address.street, [x.address.postcode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const ref = listingRef({ id: x.id, reference: x.reference });
  const alt = (i: number) => photos[i]?.alt || `${typeLabel(x.property_type, l)} ${city}, ${t('photo', { n: i + 1 })}`;
  const phone = agent?.phone ?? team?.phone;
  const showCalc = !isRent && !sold && !!x.price && !x.price_on_request;
  const chips = [
    facts.length > 0 && { h: '#h-facts', label: t('facts') },
    x.description && { h: '#h-desc', label: t('description') },
    energy && { h: '#h-energy', label: t('energy').replace(/ \(.*\)$/, '') },
    photos.length > 5 && { h: '#h-photos', label: t('allPhotos', { n: photos.length }) },
    x.address.lat != null && { h: '#h-loc', label: t('location') },
    showCalc && { h: '#listing-calc-h', label: t('calcTitle') },
  ].filter(Boolean) as { h: string; label: string }[];
  return (
    <Site l={l} route="listing" segs={[x.slug]} section={isRent ? 'rent' : sold ? 'sold' : 'buy'}
      title={title}
      description={(x.description_text ?? x.title).replace(/\s+/g, ' ').slice(0, 155)}
      image={photos[0] && img(photos[0].url, { w: 1200, h: 630 })}
      jsonLd={jsonLd}
      noindex={sold}>

      <div className="wrap top">
        <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, back, { label: x.title }]} />
        <div className="intro">
          <div className="intro__main">
            <p className="kicker">{isRent ? t('forRent') : sold ? t('sold') : t('forSale')} · {typeLabel(x.property_type, l)}</p>
            <h1 className="title">{x.title}</h1>
            {where && <p className="where">{where}</p>}
          </div>
          <dl className="intro__figs">
            {x.rooms != null && <div><dt>{t('rooms')}</dt><dd className="num">{dec(x.rooms, l)}</dd></div>}
            {x.living_surface != null && <div><dt>{t('livingArea')}</dt><dd className="num">{formatSurface(x.living_surface)}</dd></div>}
            <div><dt>{isRent ? t('rent') : t('price')}</dt><dd className="num">{price(x, l)}</dd></div>
          </dl>
        </div>
      </div>

      {photos.length > 0 ? (
        <div className="wrap">
          <div className={`gal gal--${Math.min(photos.length, 5)}`}>
            {photos.slice(0, 5).map((p, i) => (
              <a key={i} className="gal__item" href={photos.length > 5 ? `#photo-${i + 1}` : undefined}>
                <Img src={p} alt={alt(i)} width={i === 0 ? 1200 : 600} height={i === 0 ? 800 : 400} priority={i === 0}
                  sizes={i === 0 ? '(min-width: 1320px) 610px, (min-width: 761px) 48vw, 88vw' : '(min-width: 1320px) 300px, (min-width: 761px) 24vw, 88vw'} />
                {i === 4 && photos.length > 5 && <span className="gal__more">{t('allPhotos', { n: photos.length })}</span>}
                <span className="gal__n num" aria-hidden="true">{i + 1} / {photos.length}</span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="wrap"><div className="nophoto">{t('noPhoto')}</div></div>
      )}

      {chips.length > 1 && (
        <nav className="wrap chips" aria-label={t('facts')}>
          <ul className="plain-list">{chips.map((c) => <li key={c.h}><a href={c.h}>{c.label}</a></li>)}</ul>
        </nav>
      )}

      <div className="wrap body">
        <div className="main">
          {dev && (
            <p className="devnote">{t('partOfDev', { name: dev.title })} <a className="more" href={href('developments', l, dev.slug)}>{t('seeAllUnits')}</a></p>
          )}
          {facts.length > 0 && (
            <section aria-labelledby="h-facts">
              <h2 id="h-facts" className="sec-h">{t('facts')}</h2>
              <dl className="facts">
                {facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd className="num">{f.v}</dd></div>)}
                {isRent && charges != null && <div><dt>{t('charges')}</dt><dd className="num">{formatAmount(charges)}</dd></div>}
              </dl>
            </section>
          )}
          {x.description && (
            <section aria-labelledby="h-desc">
              <h2 id="h-desc" className="sec-h">{t('description')}</h2>
              <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(x.description) }} />
            </section>
          )}
          {x.features.length > 0 && (
            <section aria-labelledby="h-feat">
              <h2 id="h-feat" className="sec-h">{t('features')}</h2>
              <ul className="feats">{x.features.map((f) => <li key={f}>{featureLabel(f, locale)}</li>)}</ul>
            </section>
          )}
          {energy && (
            <section aria-labelledby="h-energy">
              <h2 id="h-energy" className="sec-h">{t('energy')}</h2>
              <EnergyScale value={energy} label={t('energy')} classLabel={t('energyClass', { c: energy })} />
            </section>
          )}
          {photos.length > 5 && (
            <section aria-labelledby="h-photos" className="allph">
              <h2 id="h-photos" className="sec-h">{t('photos')} <span className="num">({photos.length})</span></h2>
              <ul>
                {photos.map((p, i) => (
                  <li key={i} id={`photo-${i + 1}`}><Img src={p} alt={alt(i)} width={i === 0 ? 1200 : 600} height={i === 0 ? 800 : 400} sizes={i === 0 ? '(min-width: 1320px) 800px, (min-width: 1080px) 60vw, 100vw' : '(min-width: 1320px) 400px, (min-width: 1080px) 30vw, 50vw'} /></li>
                ))}
              </ul>
            </section>
          )}
          {x.address.lat != null && x.address.lng != null && (
            <section aria-labelledby="h-loc">
              <h2 id="h-loc" className="sec-h">{t('location')}</h2>
              <p className="muted">{[city, t('approxLocation')].filter(Boolean).join(' · ')}</p>
              <StaticMap lat={x.address.lat} lng={x.address.lng} zoom={14} area label={`${t('location')}: ${city}`} linkLabel={t('openMap')} />
            </section>
          )}
          {showCalc && <Affordability l={l} price={x.price!} id="listing-calc" tone="paper" />}
        </div>

        <aside className="side" id="contact" aria-labelledby="h-enquiry">
          <div className="side__card">
            <h2 id="h-enquiry" className="side__h">{sold ? t('soldCta') : t('askViewing')}</h2>
            {agent && (
              <div className="adv">
                <Portrait agent={agent} w={96} ratio="square" sizes="72px" className="adv__photo" />
                <div>
                  <p className="adv__name"><a href={href('team', l, agent.slug)}>{agent.first_name} {agent.last_name}</a></p>
                  {team && <p className="adv__team"><a href={href('offices', l, team.slug)}>{t('officeOf', { city: cityName(team.city, l) || team.name })}</a></p>}
                  {phone && <p className="adv__tel"><a className="num" href={tel(phone)}>{phone}</a></p>}
                </div>
              </div>
            )}
            <EnquiryForm locale={locale} listingId={x.id} agentId={agent?.id} agentName={agent?.first_name}
              message={kt('interested', { title: x.title, ref }, klang(locale))} submitLabel={t('askViewing')} />
            <p className="ref">{t('reference')} {ref}</p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section section--paper" aria-labelledby="h-similar">
          <div className="wrap">
            <h2 id="h-similar" className="h2 sim-h">{t('similar', { city })}</h2>
            <ul className="plain-list grid3">{similar.map((y) => <li key={y.id}><ListingCard listing={y} l={l} /></li>)}</ul>
          </div>
        </section>
      )}

      <div className="mbar">
        <a className="button" href="#contact">{t('enquiry')}</a>
        {phone && <a className="button button--ghost" href={tel(phone)}>{t('call')}</a>}
      </div>
    </Site>
  );
}
