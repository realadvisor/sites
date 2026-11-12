/**
 * A listing told like a short story: the opening photo full bleed with a
 * title bar, then the description paragraph by paragraph with the photos
 * set between them, then the facts, the place, the agent and the form.
 */
import type { Route } from './+types/listing';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { listingIdFromSlug, sanitizeHtml } from '@realadvisor/sites-kit-core';
import { img } from '@realadvisor/sites-kit-core/image';
import { t } from '@realadvisor/sites-kit-core/i18n';
import { listingJsonLd, listingRef, listingTitle } from '@realadvisor/sites-kit-core/seo';
import type { Photo as PhotoData } from '@realadvisor/sites-sdk/types';
import { Site } from '../components/Site';
import { ListingCard } from '../components/ListingCard';
import { AgentBlock } from '../components/AgentBlock';
import { Photo } from '../components/Photo';
import { agency, cardOf, sites } from '../lib/data.server';
import type { Listing } from '../lib/data';
import { districtOf, placeOf } from '../lib/districts';
import { CONTENT_LANG, LOCALE_OF, UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import { baths, blocks, factRows, price, rooms, surface, telHref } from '../lib/format';
import './listing.css';

type Group = { kind: 'wide' | 'pair' | 'inset' | 'grid'; items: { photo: PhotoData; no: number }[] };
type Step = { text?: string; group?: Group };

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const lang = langOfPath(url.pathname);
  const ui = UI[lang];
  const l = await sites.listing(params.slug);
  // A slug ending with a listing id was a listing of this site: 410 Gone.
  if (!l) throw notFound(!!listingIdFromSlug(params.slug));
  const city = l.address.city;
  const [ag, sameCity, all] = await Promise.all([
    agency(),
    city ? sites.allListings({ city }) : Promise.resolve([] as Listing[]),
    sites.allListings({ status: 'available', offer_type: l.offer_type }),
  ]);
  const district = districtOf(l);
  const place = placeOf(l);

  // The story: text blocks with photo groups between them (one wide, a pair, one inset), the rest after.
  const text = blocks(l.description);
  const photos = l.photos.slice(1).map((photo, i) => ({ photo, no: i + 2 }));
  const groups: Group[] = [];
  let i = 0;
  for (const kind of ['wide', 'pair', 'inset'] as const) {
    const n = kind === 'pair' ? 2 : 1;
    if (photos.length - i < n) break;
    groups.push({ kind, items: photos.slice(i, i + n) });
    i += n;
  }
  if (photos.length - i === 1) groups.push({ kind: 'wide', items: photos.slice(i) });
  else if (i < photos.length) groups.push({ kind: 'grid', items: photos.slice(i) });
  const story: Step[] = [];
  for (let s = 0; s < Math.max(text.length, groups.length); s++) {
    if (text[s]) story.push({ text: text[s] });
    if (groups[s]) story.push({ group: groups[s] });
  }

  const similar = (district ? sameCity.filter((y) => districtOf(y)?.slug === district.slug) : sameCity)
    .filter((y) => y.id !== l.id && y.status === 'available');
  const more = (similar.length ? similar : all.filter((y) => y.id !== l.id)).slice(0, 2);
  const osm = l.address.lat != null && l.address.lng != null
    ? `https://www.openstreetmap.org/?mlat=${l.address.lat}&mlon=${l.address.lng}#map=15/${l.address.lat}/${l.address.lng}`
    : undefined;
  const kl = l;
  const desc = (l.description_text ?? '').replace(/\s+/g, ' ').trim();
  return {
    lang,
    listing: { ...cardOf(l), agent: l.agent },
    ref: listingRef(kl),
    title: `${listingTitle(kl, sameCity)} | ${price(l, lang)}`,
    description: (desc || l.title).slice(0, 158),
    jsonLd: listingJsonLd(kl, new URL(url.pathname, siteUrl()).href),
    facts: factRows(l, lang, place),
    keyFacts: [rooms(l.rooms, lang), baths(l.bathrooms, lang), surface(l.living_surface)].filter(Boolean),
    place,
    district: district && { slug: district.slug, name: district.name },
    story,
    hasText: text.length > 0,
    more: more.map(cardOf),
    moreTitle: similar.length ? fill(ui.more, { place: district?.name ?? city ?? '' }) : ui.moreNear,
    osm,
    teamPhone: ag.team?.phone,
  };
}

export default function ListingPage({ loaderData: d }: Route.ComponentProps) {
  const { lang, listing: l, ref, place, district, osm } = d;
  const ui = UI[lang];
  const textLang = lang === CONTENT_LANG ? undefined : CONTENT_LANG;
  const sold = l.status === 'sold';
  const agent = l.agent;
  const back = sold ? 'sold' : l.offer_type === 'buy' ? 'buy' : 'rent';
  const n = l.photos.length;
  return (
    <Site lang={lang} current={back} title={d.title} description={d.description} noindex={sold}
      image={l.photos[0] && img(l.photos[0].url, { w: 1200, h: 630 })}
      alternates={alternates('listing', l.slug)} jsonLd={d.jsonLd}>
      <article className="lp">
        <div className="opening">
          <div className="frame opening-photo">
            {l.photos[0]
              ? <Photo src={l.photos[0]} alt={l.photos[0].alt || l.title} width={1600} height={900} priority widths={[640, 960, 1280, 1600, 1920]} sizes="100vw" mobile={{ width: 800, height: 1000 }} />
              : <span className="no-photo">{place}</span>}
          </div>
          <div className="wrap bar">
            <div className="bar-title">
              <p className="bar-back small"><a href={href(back, lang)}><span aria-hidden="true">←</span> {fill(ui.backTo, { page: ui.nav[back] })}</a></p>
              <h1 className="d-l" lang={textLang}>{l.title}</h1>
              <p className="bar-place">{place}</p>
            </div>
            <ul className="bar-facts">
              {d.keyFacts.map((f) => <li key={f} className="num">{f}</li>)}
              <li className="num bar-price">{price(l, lang)}</li>
            </ul>
            {!sold && <a className="cta cta-solid bar-cta" href="#enquire">{ui.enquire}</a>}
          </div>
        </div>

        {sold && <p className="wrap sold-note">{ui.soldNote}</p>}

        <div className="story" lang={textLang}>
          {d.story.map((s, k) => s.text ? (
            <div key={k} className={`wrap story-text${k === 0 ? ' is-first' : ''}`}>
              <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.text) }} />
            </div>
          ) : s.group && (
            <div key={k} className={`wrap story-photos is-${s.group.kind}`}>
              {s.group.items.map(({ photo: p, no }) => (
                <figure key={no} className="frame">
                  <Photo src={p} alt={p.alt || fill(ui.photoN, { i: no, n })}
                    width={s.group!.kind === 'pair' ? 800 : s.group!.kind === 'inset' ? 1100 : 1500}
                    height={s.group!.kind === 'pair' ? 1000 : s.group!.kind === 'inset' ? 825 : 1000}
                    sizes={s.group!.kind === 'wide' ? '(min-width: 1520px) 1424px, 100vw' : s.group!.kind === 'inset' ? '(min-width: 900px) 64vw, 100vw' : '(min-width: 760px) 48vw, 100vw'} />
                </figure>
              ))}
            </div>
          ))}
          {ui.descriptionLang && d.hasText && <p className="wrap small muted desc-lang" lang={lang}>{ui.descriptionLang}</p>}
        </div>

        <section className="wrap facts" aria-labelledby="facts-h">
          <h2 id="facts-h" className="d-l">{ui.theFacts}</h2>
          <div>
            <dl className="facts-list">
              {d.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="num">{v}</dd></div>)}
            </dl>
            <p className="small muted facts-ref">{ui.ref} {ref}</p>
          </div>
        </section>

        {(osm || place) && (
          <section className="wrap where" aria-labelledby="where-h">
            <h2 id="where-h" className="d-l">{ui.location}</h2>
            <div className="where-text">
              <p className="lead">{[l.address.street, place].filter(Boolean).join(', ')}</p>
              {district && <p><a className="arrow-link" href={href('areas', lang, district.slug)}>{fill(ui.areaHomes, { name: district.name })} <span aria-hidden="true">→</span></a></p>}
              {osm && <p><a className="arrow-link" href={osm} rel="noopener">{ui.openMap} <span aria-hidden="true">↗</span></a></p>}
              {osm && <p className="small muted">{ui.approx}</p>}
            </div>
          </section>
        )}

        {!sold && (
          <section id="enquire" className="enquire" aria-labelledby="enquire-h">
            <div className="wrap enquire-in">
              <div className="enquire-agent">
                <h2 id="enquire-h" className="d-l">{ui.formTitle}</h2>
                <p className="lead">{ui.formLead}</p>
                {agent ? (
                  <div className="enquire-who">
                    <p className="label muted">{ui.agentTitle}</p>
                    <AgentBlock agent={agent} lang={lang} heading="h3" />
                  </div>
                ) : d.teamPhone && (
                  <p><a className="arrow-link" href={telHref(d.teamPhone)}>{ui.call} {d.teamPhone}</a></p>
                )}
              </div>
              <div className="enquire-form">
                <EnquiryForm listingId={l.id} agentId={agent?.id} agentName={agent?.first_name} locale={LOCALE_OF[lang]}
                  message={t('interested', { title: l.title, ref }, lang)} />
              </div>
            </div>
          </section>
        )}

        {!sold && (
          <div className="sticky-cta">
            <span className="num">{price(l, lang)}</span>
            <a className="cta cta-solid" href="#enquire">{ui.enquire}</a>
          </div>
        )}
      </article>

      {d.more.length > 0 && (
        <section className="wrap more" aria-labelledby="more-h">
          <h2 id="more-h" className="d-l">{d.moreTitle}</h2>
          <div className="more-grid">
            {d.more.map((y) => <ListingCard key={y.id} listing={y} lang={lang} />)}
          </div>
        </section>
      )}
    </Site>
  );
}
