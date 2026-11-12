import type { Route } from './+types/listing';
import { listingIdFromSlug, sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { featureLabel, offerTypeLabel, t } from '@realadvisor/sites-kit/i18n';
import { listingJsonLd, listingRef, listingTitle } from '@realadvisor/sites-kit/seo';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { canonical } from '@realadvisor/sites-kit-react/server/kit';
import type { Listing } from '@realadvisor/sites-sdk/types';
import { Site } from '../components/Site';
import { Gallery } from '../components/Gallery';
import { ListingCard } from '../components/ListingCard';
import { EnergyScale } from '../components/EnergyScale';
import { AgentPortrait } from '../components/AgentPortrait';
import { sites } from '../lib/data.server';
import { agentSlug, slugify, towns } from '../lib/data';
import { CONTENT_LANG, LOCALE_OF, UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import { price, surface, telHref, typeLabel } from '../lib/format';
import './listing.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const lang = langOfPath(url.pathname);
  const l = await sites.listing(params.slug);
  // A slug ending with a listing id was a listing of this site: 410 Gone.
  if (!l) throw notFound(!!listingIdFromSlug(params.slug));
  const ui = UI[lang];
  const city = l.address.city;
  const [sameCity, all] = await Promise.all([city ? sites.allListings({ city }) : Promise.resolve([] as Listing[]), sites.allListings()]);
  const kind = typeLabel(l, lang);
  const energy = l.energy_class;
  const facts: [string, string][] = [
    [ui.type, kind],
    [t('offer', {}, lang), offerTypeLabel(l.offer_type, LOCALE_OF[lang])],
    ...(city ? [[ui.town, city] as [string, string]] : []),
    ...(l.bedrooms ? [[ui.bedrooms, String(l.bedrooms)] as [string, string]] : []),
    ...(l.bathrooms ? [[ui.bathrooms, String(l.bathrooms)] as [string, string]] : []),
    ...(l.rooms ? [[ui.rooms, String(l.rooms)] as [string, string]] : []),
    ...(l.living_surface ? [[ui.living, surface(l.living_surface)] as [string, string]] : []),
    ...(l.land_surface ? [[ui.land, surface(l.land_surface)] as [string, string]] : []),
    ...(l.terrace_surface ? [[ui.terrace, surface(l.terrace_surface)] as [string, string]] : []),
    ...(l.construction_year ? [[ui.yearBuilt, String(l.construction_year)] as [string, string]] : []),
    ...(energy ? [[ui.energy, energy] as [string, string]] : []),
  ];
  return {
    lang,
    l,
    facts,
    energy,
    ref: listingRef(l),
    title: `${listingTitle(l, sameCity)} | ${price(l, lang)}`,
    similar: sameCity.filter((x) => x.id !== l.id && x.status === 'available').slice(0, 3),
    hasArea: !!city && towns(all).some((tw) => tw.slug === slugify(city)),
    jsonLd: listingJsonLd(l, canonical(new URL(url.pathname, url))),
  };
}

export default function ListingPage({ loaderData: { lang, l, facts, energy, ref, title, similar, hasArea, jsonLd } }: Route.ComponentProps) {
  const ui = UI[lang];
  const locale = LOCALE_OF[lang];
  const textLang = lang === CONTENT_LANG ? undefined : CONTENT_LANG;
  const city = l.address.city;
  const kind = typeLabel(l, lang);
  const sold = l.status === 'sold';
  const agent = l.agent;
  const back = sold ? 'sold' : l.offer_type === 'buy' ? 'buy' : 'rent';
  const backLabel = sold ? ui.nav.sold : l.offer_type === 'buy' ? ui.nav.buy : ui.nav.rent;
  const keyFacts = [
    l.bedrooms ? [String(l.bedrooms), ui.bedrooms] : null,
    l.bathrooms ? [String(l.bathrooms), ui.bathrooms] : null,
    l.living_surface ? [surface(l.living_surface), ui.living] : null,
    l.land_surface ? [surface(l.land_surface), ui.land] : null,
  ].filter(Boolean) as [string, string][];
  const osm = l.address.lat != null && l.address.lng != null
    ? `https://www.openstreetmap.org/?mlat=${l.address.lat}&mlon=${l.address.lng}#map=14/${l.address.lat}/${l.address.lng}`
    : undefined;
  const tel = agent?.phone ? telHref(agent.phone) : undefined;
  const desc = (l.description_text ?? '').replace(/\s+/g, ' ').trim();
  const areaLink = hasArea && city && (
    <a className="link" href={href('areas', lang, slugify(city))}>{fill(ui.areaH1, { town: city })} <span className="arrow" aria-hidden="true">→</span></a>
  );
  return (
    <Site lang={lang} current={back} title={title} description={(desc || l.title).slice(0, 158)} noindex={sold}
      image={l.photos[0] && img(l.photos[0].url, { w: 1200, h: 630 })}
      alternates={alternates('listing', l.slug)} jsonLd={jsonLd}>
      <div className="wrap lp">
        <nav className="crumbs" aria-label={backLabel}>
          <a href={href(back, lang)}><span aria-hidden="true">←</span> {fill(ui.backTo, { page: backLabel })}</a>
        </nav>

        <header className="lp-head">
          <div>
            <p className="lp-where">{[city, kind].filter(Boolean).join(' · ')}</p>
            <h1 className="display-l" lang={textLang}>{l.title}</h1>
          </div>
          <div className="lp-price">
            <p className="num lp-price-v">{price(l, lang)}</p>
            <p className="lp-ref">{ui.ref} {ref}</p>
          </div>
        </header>

        <Gallery photos={l.photos} alt={`${kind}${city ? `, ${city}` : ''}`} lang={lang} empty={kind} />

        {keyFacts.length > 0 && (
          <ul className="kf">
            {keyFacts.map(([v, k]) => <li key={k}><span className="kf-v num">{v}</span><span className="kf-k">{k}</span></li>)}
          </ul>
        )}

        <div className="lp-body">
          <div className="lp-main">
            {l.description && (
              <section className="lp-sec">
                {textLang && <p className="lp-note">{ui.descriptionLang}</p>}
                <div className="prose lp-desc" lang={textLang} dangerouslySetInnerHTML={{ __html: sanitizeHtml(l.description) }} />
              </section>
            )}

            <section className="lp-sec" aria-labelledby="facts-h">
              <h2 id="facts-h" className="lp-h">{ui.features}</h2>
              <dl className="spec-wide">
                {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="num">{v}</dd></div>)}
              </dl>
              {l.features.length > 0 && (
                <ul className="feat">{l.features.map((f) => <li key={f}>{featureLabel(f, locale)}</li>)}</ul>
              )}
            </section>

            {energy && (
              <section className="lp-sec">
                <EnergyScale value={energy} lang={lang} />
              </section>
            )}

            {city && (
              <section className="lp-sec" aria-labelledby="loc-h">
                <h2 id="loc-h" className="lp-h">{ui.location}</h2>
                <p className="loc">{[l.address.postcode, city].filter(Boolean).join(' ')}</p>
                <p className="loc-links">
                  {areaLink}
                  {osm && <a className="link" href={osm} rel="noopener" target="_blank">{ui.openMap} <span aria-hidden="true">↗</span></a>}
                </p>
                {osm && <p className="lp-note">{ui.approx}</p>}
              </section>
            )}
          </div>

          <aside className="lp-aside">
            <div className="card-sticky">
              <p className="aside-k">{offerTypeLabel(l.offer_type, locale)}</p>
              <p className="num aside-price">{price(l, lang)}</p>
              {agent && (
                <div className="aside-agent">
                  <p className="aside-k">{ui.yourAgent}</p>
                  <AgentPortrait agent={agent} sizes="120px" className="aside-photo" />
                  <p className="aside-name"><a href={href('team', lang, agentSlug(agent))}>{agent.first_name} {agent.last_name}</a></p>
                </div>
              )}
              {!sold && <a className="cta cta-accent" href="#enquiry">{ui.askVisit}</a>}
              {agent?.phone && <a className="cta cta-line num" href={tel}>{agent.phone}</a>}
              {agent?.email && <a className="aside-mail" href={`mailto:${agent.email}`}>{agent.email}</a>}
            </div>
          </aside>
        </div>
      </div>

      {!sold && (
        <section className="ask" aria-labelledby="ask-h">
          <div className="wrap ask-in">
            <div className="ask-intro">
              <h2 id="ask-h" className="display-m">{ui.askAbout}</h2>
              {agent && (
                <div className="ask-agent">
                  <AgentPortrait agent={agent} sizes="140px" className="ask-photo" />
                  <p className="ask-name">{agent.first_name} {agent.last_name}</p>
                  {agent.phone && <p><a className="num" href={tel}>{agent.phone}</a></p>}
                  {agent.email && <p><a href={`mailto:${agent.email}`}>{agent.email}</a></p>}
                </div>
              )}
            </div>
            <EnquiryForm listingId={l.id} agentId={agent?.id} agentName={agent?.first_name} locale={locale}
              message={t('interested', { title: l.title, ref }, lang)} className="ask-form" />
          </div>
        </section>
      )}

      {similar.length > 0 && city && (
        <section className="section wrap">
          <div className="section-head">
            <div><h2 className="display-m">{fill(ui.similar, { town: city })}</h2></div>
            {areaLink}
          </div>
          <ul className="grid3">{similar.map((x) => <li key={x.id}><ListingCard listing={x} lang={lang} /></li>)}</ul>
        </section>
      )}

      {!sold && (
        <div className="mbar" aria-label={ui.askAbout}>
          {agent?.phone && <a className="cta cta-line" href={tel}>{ui.call}</a>}
          <a className="cta cta-accent" href="#enquiry">{ui.write}</a>
        </div>
      )}
    </Site>
  );
}
