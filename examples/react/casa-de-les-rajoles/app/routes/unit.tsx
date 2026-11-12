/**
 * Unit page (/viviendas/:slug, /en/homes/:slug), plan first: the indicative
 * plan (same scale as every other), the facts card with price and the two big
 * area figures, the unit's place on its floor, photos, the CRM description,
 * the enquiry form on this unit and other units of the same type. Sold
 * units: noindex, no price, and the form asks about the units still for sale.
 * Unknown slug: the site's 404 (a real 404 status).
 */
import type { Route } from './+types/unit';
import { sanitizeHtml } from '@realadvisor/sites-kit-core';
import { img } from '@realadvisor/sites-kit-core/image';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { FloorPlate } from '../components/FloorPlate';
import { People, person } from '../components/People';
import { loadSite, sites } from '../lib/data.server';
import { CONTENT_LANG, LANGS, LOCALE_OF, fill, href, langOfPath, tr } from '../lib/i18n';
import {
  deliveryLabel, floorName, floorsOf, kindLabel, kindOf, orientation, outdoor, outdoorLabel, planKey, planSrc, sortUnits, statusLabel,
  unitFromSlug, unitNumber, unitOptions, unitPrice, unitRow, unitShort, unitSlug, unitTitle, wingOf,
} from '../lib/units.server';
import { WING_ADDRESS } from '../content/site';
import PLAN_SIZES from '../content/plans.json';
import { m2 } from '../lib/format';
import './unit.css';

const ENERGY = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export async function loader({ request, params }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const t = tr(lang);
  const site = await loadSite();
  const { dev } = site;
  const u = unitFromSlug(dev, params.slug ?? '');
  if (!u) throw notFound();
  const units = sortUnits(dev.units);
  const wing = wingOf(u);
  const o = outdoor(u);
  const key = planKey(u);
  const planDims = (PLAN_SIZES as Record<string, { full: number[]; fit: number[] }>)[key]?.fit ?? [960, 700];
  const listing = u.listing_slug ? await sites.listing(u.listing_slug) : null;
  const energy = listing?.energy_class;
  const sameFloor = units.filter((x) => wingOf(x) === wing && x.floor === u.floor);
  const scale = Math.max(...floorsOf(units, wing).map((f) => units.filter((x) => wingOf(x) === wing && x.floor === f).reduce((s, x) => s + (x.living_surface ?? 0), 0)));
  const similar = units.filter((x) => x.id !== u.id && kindOf(x) === kindOf(u) && x.status !== 'sold').slice(0, 4);
  const photos = u.photos ?? [];
  const name = unitTitle(u, lang);
  const number = unitNumber(u);
  const kind = kindOf(u) === 'atico' ? `${t.kinds.atico[0]}, ${u.bedrooms} ${t.bedroomsShort}` : kindLabel(kindOf(u), lang);
  const options = unitOptions(units, lang);
  const facts: [string, string][] = [
    number ? [t.number, number] : null,
    [t.wing, `${t.wings[wing]}, ${WING_ADDRESS[wing]}`],
    [t.floorLabel, floorName(u, lang)],
    u.bedrooms != null ? [t.bedrooms, String(u.bedrooms)] : null,
    u.bathrooms != null ? [t.bathrooms, String(u.bathrooms)] : null,
    orientation(u, lang) ? [t.orientation, orientation(u, lang)] : null,
    dev.delivery_date ? [t.delivery, deliveryLabel(dev, lang)] : null,
    listing?.reference ? [t.ref, listing.reference] : null,
  ].filter((x): x is [string, string] => !!x);
  const description = [kind, floorName(u, lang), t.wings[wing], u.living_surface && m2(u.living_surface), o && `${outdoorLabel(o, lang).toLowerCase()} ${m2(o.m2)}`, u.status === 'available' ? unitPrice(u, lang) : statusLabel(u, lang)].filter(Boolean).join(' · ');
  const cover = photos[0] ?? dev.photos[0];
  return {
    lang,
    id: u.id,
    status: u.status,
    statusLabel: statusLabel(u, lang),
    price: u.status === 'available' ? unitPrice(u, lang) : '',
    floor: u.floor ?? 0,
    floorName: floorName(u, lang),
    living: u.living_surface ?? null,
    outdoor: o,
    outdoorLabel: outdoorLabel(o, lang),
    description: u.description,
    wing,
    name,
    number,
    kind,
    plan: { full: planSrc(key, lang), fit: planSrc(key, lang, true), w: planDims[0]!, h: planDims[1]! },
    energy,
    sameFloor: sameFloor.map((x) => unitRow(x, lang)),
    scale,
    similar: similar.map((x) => unitRow(x, lang)),
    similarTitle: fill(t.similar, { k: kindLabel(kindOf(u), lang, 2).toLowerCase() }),
    photos,
    facts,
    title: `${number ? `${unitShort(u, lang)}: ` : ''}${name} | ${dev.title}`,
    metaDescription: `${dev.title}, Russafa. ${description}.`,
    image: cover && img(cover.url, { w: 1200, h: 630 }),
    alternates: LANGS.map((l) => ({ lang: LOCALE_OF[l], href: href('units', l, unitSlug(u)) })),
    devId: dev.id,
    agentName: dev.agents[0]?.first_name,
    options: u.status === 'sold' ? options : [],
    firstOther: similar[0]?.id ?? options[0]?.value,
    msg: fill(t.msgUnit, { u: number ? `${t.unit.toLowerCase()} ${number} (${name})` : name }),
    msgNotify: fill(t.msgNotify, { k: kind.toLowerCase(), w: t.wings[wing] }),
    people: site.people.map(person),
  };
}

export default function Unit({ loaderData: d }: Route.ComponentProps) {
  const { lang, wing, outdoor: o } = d;
  const t = tr(lang);
  const sold = d.status === 'sold';
  return (
    <Layout lang={lang} route="units" title={d.title} description={d.metaDescription} image={d.image} alternates={d.alternates} noindex={sold} page="pg-unit">
      <div className="wrap top">
        <nav className="crumbs" aria-label={lang === 'es' ? 'Ruta' : 'Breadcrumb'}>
          <a href={href('units', lang)}>{t.backUnits}</a>
          <span aria-hidden="true">/</span>
          <a href={`${href('units', lang)}?ala=${wing}#planta`}>{t.wings[wing]}</a>
          <span aria-hidden="true">/</span>
          <a href={`${href('units', lang)}?ala=${wing}&planta=${d.floor}#planta`}>{d.floorName}</a>
        </nav>
        <h1>{d.number && <span className="no">{d.number}</span>}{d.name}</h1>
      </div>

      <div className="wrap main">
        <section className="plan" aria-label={t.plansTitle}>
          <figure>
            <a href={d.plan.full} className="plan-link">
              <img src={d.plan.fit} alt={`${t.indicative} ${d.kind}, ${t.wings[wing]}`} width={d.plan.w} height={d.plan.h} />
            </a>
            <figcaption>{t.indicative} <a href={d.plan.full}>{lang === 'es' ? 'Plano a escala común' : 'Plan at the common scale'}</a></figcaption>
          </figure>
          <div className="pos">
            <h2>{t.mapPosition}</h2>
            <FloorPlate units={d.sameFloor} lang={lang} wing={wing} scaleArea={d.scale} selected={d.id} compact label={`${d.floorName}, ${t.wings[wing]}`} />
          </div>
        </section>

        <aside className="card" aria-label={t.price}>
          <p className="st"><span className={`pill ${d.status}`}>{d.statusLabel}</span></p>
          <p className="price num">{d.price}</p>
          <div className="big">
            <div><b className="num">{d.living ?? '–'}<small>m²</small></b><span>{t.interior}</span></div>
            <div><b className="num">{o ? o.m2 : '–'}{o && <small>m²</small>}</b><span>{d.outdoorLabel.toLowerCase()}</span></div>
          </div>
          <dl>
            {d.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {d.energy && (
            <div className="energy">
              <p>{t.energy}</p>
              <ol aria-label={`${t.energy}: ${d.energy}`}>
                {ENERGY.map((c, i) => <li key={c} className={[`e${i}`, c === d.energy && 'on'].filter(Boolean).join(' ')}>{c === d.energy ? c : ''}</li>)}
              </ol>
            </div>
          )}
          <a className="cta coral" href="#consulta">{t.askUnit}</a>
        </aside>
      </div>

      {d.photos.length > 0 && (
        <section className="wrap photos" aria-labelledby="ph-h">
          <h2 id="ph-h" className="visually-hidden">{t.photosTitle}</h2>
          <div className={`ph-grid n${Math.min(d.photos.length, 3)}`}>
            {d.photos.slice(0, 3).map((p, i) => <Photo key={p.url} src={p.url} alt={p.alt} lang={CONTENT_LANG} width={i === 0 ? 1200 : 700} height={i === 0 ? 800 : 520} sizes={i === 0 ? '(min-width: 900px) 60vw, 100vw' : '(min-width: 900px) 30vw, 50vw'} />)}
          </div>
          <p className="muted small">{t.photoNote}</p>
        </section>
      )}

      <section className="wrap about">
        {d.description && (
          <div>
            <h2>{t.descriptionTitle}</h2>
            <div className="prose" lang={CONTENT_LANG} dangerouslySetInnerHTML={{ __html: sanitizeHtml(d.description) }} />
          </div>
        )}
        <div id="consulta" className="ask">
          <h2>{t.askTitle}</h2>
          {sold ? (
            <>
              <p className="muted">{t.askSold}</p>
              <EnquiryForm id="consulta-form" developmentId={d.devId} units={d.options} selectedUnit={d.firstOther} agentName={d.agentName} locale={LOCALE_OF[lang]} message={d.msgNotify} />
            </>
          ) : (
            <EnquiryForm id="consulta-form" developmentId={d.devId} lotId={d.id} agentName={d.agentName} locale={LOCALE_OF[lang]} message={d.msg} />
          )}
          <People people={d.people} lang={lang} className="people-sm" />
        </div>
      </section>

      {d.similar.length > 0 && (
        <section className="wrap similar" aria-labelledby="s-h">
          <h2 id="s-h">{d.similarTitle}</h2>
          <ul>
            {d.similar.map((x) => (
              <li key={x.id}>
                <a href={x.href}>
                  <span className="s-no">{x.number}</span>
                  <span className="s-what"><b>{t.wings[x.wing]} · {x.floorName}</b><span className="num">{x.living ? m2(x.living) : null}{x.outdoor && ` · ${x.outdoorLabel.toLowerCase()} ${m2(x.outdoor.m2)}`}</span></span>
                  <span className="s-price num">{x.status === 'available' ? x.price : <span className={`pill ${x.status}`}>{x.statusLabel}</span>}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Layout>
  );
}
