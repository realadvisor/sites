/**
 * One unit: plan first (our indicative drawing), the key figures and price
 * beside it, its place in the building (the axonometric with this unit
 * lit, the other units links to their pages), photos, text, and the enquiry
 * form filed on this unit. Sold units: noindex, no price, the form offers
 * the other units. Unknown unit: 404; a non-canonical slug: 301.
 */
import type { Route } from './+types/unit';
import { redirect } from 'react-router';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { IsoDrawing } from '../components/IsoDrawing';
import { AgentCard } from '../components/AgentCard';
import { Lightbox } from '../components/Lightbox';
import { loadSite } from '../lib/data.server';
import { href, langOf, LOCALE, LANGS } from '../lib/routes';
import { c } from '../lib/copy';
import {
  building, buildingName, deliveryLabel, floorName, formatRooms, isPenthouse, outdoorLabel, outdoors, orientation, planKey, planSrc,
  shortId, sortUnits, statusLabel, unitFromSlug, unitLabel, unitNumber, unitOptions, unitPath, unitPrice, unitTitle, hasPrice,
} from '../lib/units';
import { unitTextDe } from '../content/project';
import { photoAlt } from '../content/photo-alts';
import './unit.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const l = langOf(url.pathname);
  const site = await loadSite(request);
  const u = unitFromSlug(site.dev, params.slug ?? '');
  if (!u) throw notFound();
  const canonical = unitPath(u, l);
  if (url.pathname !== canonical) throw redirect(canonical, 301);
  return { l, site, id: u.id };
}

export default function UnitPage({ loaderData: { l, site, id } }: Route.ComponentProps) {
  const { dev } = site;
  const all = dev.units;
  const u = all.find((x) => x.id === id)!;
  const list = sortUnits(all);
  const i = list.indexOf(u);
  const prev = list[i - 1];
  const next = list[i + 1];
  const num = unitNumber(u);
  const label = unitLabel(u, l, all);
  const outs = outdoors(u);
  const plan = planSrc(planKey(u, all), l, true);
  const delivery = deliveryLabel(dev, l);
  const ori = orientation(u, l);
  const sold = u.status === 'sold';
  const pent = isPenthouse(u, all);
  const photos = u.photos ?? [];
  const same = list.filter((x) => x !== u && x.rooms === u.rooms && isPenthouse(x, all) === pent && x.status !== 'sold');
  const roomsTxt = formatRooms(u.rooms, l);
  const descDe = unitTextDe({
    rooms: String(u.rooms ?? ''),
    surface: u.living_surface ? `${u.living_surface} m²` : '',
    floor: floorName(u, l, all),
    house: buildingName(building(u), l),
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    outdoor: outs.map((o) => `${outdoorLabel(o, l)} von ${o.m2} m²`).join(' und '),
  });
  const T = {
    it: {
      title: `${num ? `${num}, ` : ''}${label} | ${unitPrice(u, 'it')} | ${dev.title}`,
      desc: `${roomsTxt}${u.living_surface ? ` di ${u.living_surface} m²` : ''}, ${floorName(u, l, all).toLowerCase()}, ${buildingName(building(u), l)}. ${dev.title}, Castagnola, Lugano.`,
      back: 'Tutti gli appartamenti',
      where: 'Nella casa',
      whereCap: `${num} in ${buildingName(building(u), l)}, ${floorName(u, l, all).toLowerCase()}.`,
      photos: 'Foto',
      about: 'L’appartamento',
      enquiry: sold ? 'Questo appartamento è venduto' : 'Richiedi informazioni su questo appartamento',
      enquiryP: sold ? 'Scrivici per uno degli appartamenti ancora disponibili.' : 'Rispondiamo entro un giorno lavorativo con il listino, la descrizione e una proposta di visita.',
      message: `Buongiorno, vorrei ricevere informazioni sull’appartamento ${num ? `${num} (${label})` : label}.`,
      similar: 'Altri appartamenti di questo tipo',
      planNone: 'Pianta su richiesta.',
    },
    de: {
      title: `${num ? `${num}, ` : ''}${label} | ${unitPrice(u, 'de')} | ${dev.title}`,
      desc: `${roomsTxt}${u.living_surface ? `, ${u.living_surface} m²` : ''}, ${floorName(u, l, all)}, ${buildingName(building(u), l)}. ${dev.title}, Castagnola, Lugano.`,
      back: 'Alle Wohnungen',
      where: 'Im Haus',
      whereCap: `${num} in ${buildingName(building(u), l)}, ${floorName(u, l, all)}.`,
      photos: 'Fotos',
      about: 'Die Wohnung',
      enquiry: sold ? 'Diese Wohnung ist verkauft' : 'Informationen zu dieser Wohnung anfordern',
      enquiryP: sold ? 'Schreiben Sie uns zu einer der noch verfügbaren Wohnungen.' : 'Wir antworten innert eines Arbeitstags mit Preisliste, Baubeschrieb und einem Besichtigungstermin.',
      message: `Guten Tag, ich interessiere mich für die Wohnung ${num ? `${num} (${label})` : label}.`,
      similar: 'Weitere Wohnungen dieses Typs',
      planNone: 'Grundriss auf Anfrage.',
    },
  }[l];
  const facts: [string, string][] = [
    [c('house', l), buildingName(building(u), l)],
    [c('floor', l), floorName(u, l, all)],
    [c('bedrooms', l), u.bedrooms != null ? String(u.bedrooms) : ''],
    [c('bathrooms', l), u.bathrooms != null ? String(u.bathrooms) : ''],
    ...outs.slice(1).map((o) => [outdoorLabel(o, l), `${o.m2} m²`] as [string, string]),
    [c('orientation', l), ori], // fixture only: orientation
    [c('delivery', l), delivery],
  ].filter((x): x is [string, string] => !!x[1]);
  const alternates = LANGS.map((x) => ({ lang: LOCALE[x], href: unitPath(u, x) }));
  const cover = photos[0] ?? dev.photos[0];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: `${dev.title}, ${num ? `${num}, ` : ''}${label}`,
    numberOfRooms: u.rooms,
    floorSize: u.living_surface ? { '@type': 'QuantitativeValue', value: u.living_surface, unitCode: 'MTK' } : undefined,
    address: { '@type': 'PostalAddress', addressLocality: dev.address.city, postalCode: dev.address.postcode, addressCountry: 'CH' },
    ...(hasPrice(u) ? { offers: { '@type': 'Offer', price: u.price, priceCurrency: u.currency, availability: 'https://schema.org/InStock' } } : {}),
  };
  const lb = (url: string) => img(url, { w: 2000, fit: 'fit', quality: 78 });
  const phAlt = (url: string, k: number) => photoAlt(url, l, `${label}, ${c('photo', l)} ${k + 1}`);
  return (
    <Layout l={l} route="unit" scope="v-unit" alternates={alternates} title={T.title} description={T.desc} image={cover ? img(cover.url, { w: 1200, h: 630 }) : undefined} noindex={sold} jsonLd={jsonLd} bar={false}>
      <div className="wrap crumbs">
        <a href={href('units', l)} className="link">← {T.back}</a>
        <span className="pager">
          {prev && <a href={unitPath(prev, l)} rel="prev" aria-label={`${c('prev', l)}: ${unitTitle(prev, l, all)}`}>‹ {unitNumber(prev)}</a>}
          {next && <a href={unitPath(next, l)} rel="next" aria-label={`${c('next', l)}: ${unitTitle(next, l, all)}`}>{unitNumber(next)} ›</a>}
        </span>
      </div>

      <section className="wrap top">
        <figure className="plan">
          {plan ? (
            <>
              <img src={plan} alt={`${c('indicativePlan', l)}: ${label}`} width="960" height="860" decoding="async" fetchPriority="high" />
              <figcaption>{c('indicativePlan', l)}</figcaption>
            </>
          ) : <p className="muted">{T.planNone}</p>}
        </figure>

        <div className="facts">
          <p className="no">{num}</p>
          <h1 className="h2">{label}</h1>
          <dl className="big">
            {u.living_surface ? <div><dt>{c('livingArea', l)}</dt><dd className="num">{u.living_surface} m²</dd></div> : null}
            {outs[0] && <div><dt>{outdoorLabel(outs[0], l)}</dt><dd className="num">{outs[0].m2} m²</dd></div>}
          </dl>
          <div className="price">
            {hasPrice(u) ? <p className="amount num">{unitPrice(u, l)}</p> : null}
            <span className={`pill ${u.status}`}>{statusLabel(u, l)}</span>
          </div>
          <dl className="list">
            {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <p className="actions">
            <a className="btn" href="#richiesta">{c('writeUs', l)}</a>
            {!sold && (
              <button type="button" className="btn ghost fav" data-fav={shortId(u)} data-unit={num} data-label-on={c('addFav', l)} data-label-off={c('removeFav', l)} data-label-full={c('favFull', l)} aria-pressed="false" hidden>
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2.6 2.2 4.6 5 .6-3.7 3.5.9 5-4.4-2.4-4.4 2.4.9-5L2.8 7.8l5-.6z" /></svg>
                <span data-fav-text="">{c('addFav', l)}</span>
              </button>
            )}
          </p>
        </div>
      </section>

      <section className="wrap where">
        <div className="where-text">
          <h2 className="h3">{T.where}</h2>
          <p className="muted">{T.whereCap}</p>
        </div>
        <IsoDrawing units={all} l={l} current={u.id} />
      </section>

      {photos.length > 0 && (
        <section className="wrap photos" aria-labelledby="ph-h">
          <h2 id="ph-h" className="h3">{T.photos}</h2>
          <div className="grid">
            {photos.slice(0, 5).map((p, k) => (
              <a key={p.url} href={lb(p.url)} data-lightbox="" data-alt={phAlt(p.url, k)} className={k === 0 ? 'ph lead' : 'ph'}>
                <Photo src={p.url} alt={phAlt(p.url, k)} width={k === 0 ? 1200 : 600} height={k === 0 ? 900 : 450} sizes={k === 0 ? '(max-width: 760px) 100vw, 50vw' : '(max-width: 760px) 50vw, 25vw'} />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="wrap about">
        <h2 className="h3">{T.about}</h2>
        {l === 'it' && u.description ? <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(u.description) }} /> : <div className="prose">{descDe.map((p) => <p key={p}>{p}</p>)}</div>}
      </section>

      <section className="enquiry-band" id="richiesta">
        <div className="wrap section e-grid">
          <div className="e-text">
            <h2 className="h3">{T.enquiry}</h2>
            <p>{T.enquiryP}</p>
            {site.agent && <AgentCard agent={site.agent} l={l} />}
          </div>
          <div className="e-form">
            {sold ? (
              <EnquiryForm developmentId={dev.id} units={unitOptions(all, l)} agentId={site.agent?.id} agentName={site.agent?.first_name} locale={LOCALE[l]} />
            ) : (
              <EnquiryForm developmentId={dev.id} lotId={u.id} agentId={site.agent?.id} agentName={site.agent?.first_name} message={T.message} locale={LOCALE[l]} />
            )}
          </div>
        </div>
      </section>

      {same.length > 0 && (
        <section className="wrap similar">
          <h2 className="h3">{T.similar}</h2>
          <ul>
            {same.map((x) => (
              <li key={x.id}><a href={unitPath(x, l)}><strong>{unitNumber(x)}</strong> <span>{unitLabel(x, l, all)}</span> <span className="num">{x.living_surface} m²</span> <span className="num p">{unitPrice(x, l)}</span></a></li>
            ))}
          </ul>
        </section>
      )}
      <Lightbox l={l} />
    </Layout>
  );
}
