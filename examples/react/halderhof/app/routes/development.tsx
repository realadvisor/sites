/**
 * Development page: photo hero with the figures that matter to a buyer
 * (available units, price from, move-in), description and project team,
 * "Preise und Verfügbarkeit" as a plain list per unit type, the table of
 * every unit (filter "only available" in CSS, no JavaScript), indicative
 * plans, photos, the building site, documents, location and the enquiry
 * form with the unit select.
 */
import type { Route } from './+types/development';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { sanitizeHtml } from '@realadvisor/sites-kit-core';
import { img } from '@realadvisor/sites-kit-core/image';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { Crumbs } from '../components/Crumbs';
import { AgentCard } from '../components/AgentCard';
import { StaticMap } from '../components/StaticMap';
import { extra, siteData, sites, unitExtras } from '../lib/data.server';
import { groupLine, groups, outdoor, planUrl, sortUnits, statusLabel, unitHref, unitNo, unitPrice, unitSelect, isAttic } from '../lib/dev';
import { documentsFor } from '../content/documents';
import { href, langOfPath, LOCALE } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { dayMonthYear, dec, floorShort, formatAmount, formatSurface, monthYear, rooms, roomsRange } from '../lib/format';
import './development.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const l = langOfPath(url.pathname);
  const d = await sites.development(params.slug);
  if (!d) throw notFound();
  const { org, teams, agents } = await siteData();
  // fixture only: construction photos
  const x = extra('developments', d.id);
  const agent = d.agents[0] ? (agents.find((a) => a.id === d.agents[0]!.id) ?? d.agents[0]) : undefined;
  return {
    l,
    d,
    orgName: org.name,
    ux: unitExtras(d.units),
    teams,
    agents: agents.map(({ id, first_name, last_name }) => ({ id, first_name, last_name })),
    agent,
    lot: url.searchParams.get('lot') ?? undefined,
    credits: { developer: d.developer?.name, architect: d.architect?.name, contractor: d.general_contractor?.name },
    site: Array.isArray(x.construction_photos) ? (x.construction_photos as unknown[]).filter((u): u is string => typeof u === 'string') : [],
    asOf: new Date().toISOString(),
  };
}

export default function Development({ loaderData: { l, d, orgName, ux, teams, agents, agent, lot, credits: c, site, asOf: now } }: Route.ComponentProps) {
  const t = tx(l);
  const units = sortUnits(d.units, ux);
  const gs = groups(units, l, ux);
  const city = cityName(d.address.city, l);
  const where = [d.address.street, [d.address.postcode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const s = d.stats;
  const delivery = monthYear(d.delivery_date, l);
  const credits = [
    typeof c.developer === 'string' && { k: t('developer'), v: c.developer },
    typeof c.architect === 'string' && { k: t('architect'), v: c.architect },
    typeof c.contractor === 'string' && { k: t('contractor'), v: c.contractor },
  ].filter(Boolean) as { k: string; v: string }[];
  const docs = documentsFor(d.slug, l);
  // One plan per type, garden-level variants only on the unit pages.
  const planTypes = gs.map((g) => ({ g, u: g.units.find((u) => u.floor !== 0) ?? g.units[0]! })).map(({ g, u }) => ({ g, src: planUrl(u, l), u })).filter((p) => p.src);
  const options = unitSelect(units, l, ux);
  const selected = options.some((o) => o.value === lot) ? lot : undefined;
  const hero = d.photos[0];
  const gallery = d.photos.slice(1);
  const asOf = dayMonthYear(now, l);
  const reserved = units.filter((u) => u.status === 'reserved').length;
  return (
    <Site l={l} route="developments" segs={[d.slug]} title={`${d.title}, ${city} | ${t('devTitle')} | ${orgName}`}
      description={(d.description_text ?? d.title).replace(/\s+/g, ' ').slice(0, 155)} image={hero && img(hero.url, { w: 1200, h: 630 })}>

      <section className="hero" data-hero="">
        {hero && <Img src={hero} alt={hero.alt || d.title} width={1600} height={800} priority sizes="100vw" mobile={{ width: 800, height: 760 }} />}
        <div className="hero__panel on-green">
          <div className="wrap hero__in">
            <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navNew'), href: href('developments', l) }, { label: d.title }]} />
            <div className="hero__row">
              <div>
                <h1 className="h1">{d.title}</h1>
                <p className="hero__where">{where}</p>
              </div>
              <dl className="figs">
                <div><dt>{t('units')}</dt><dd className="num">{t('unitsAvailable', { n: s.available, t: s.units })}</dd></div>
                {s.price && <div><dt>{t('price')}</dt><dd className="num">{t('priceFrom', { p: formatAmount(s.price.min) })}</dd></div>}
                {delivery && <div><dt>{t('delivery')}</dt><dd>{delivery}</dd></div>}
              </dl>
            </div>
            <ul className="plain-list jump">
              <li><a href="#preise">{t('priceAvail')}</a></li>
              {planTypes.length > 0 && <li><a href="#plans">{t('plans')}</a></li>}
              {docs.length > 0 && <li><a href="#docs">{t('documents')}</a></li>}
              <li><a className="jump__cta" href="#contact">{t('devContact')}</a></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section wrap intro">
        <div className="prose">{d.description && <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(d.description) }} />}</div>
        <dl className="kv">
          {s.rooms && <div><dt>{t('rooms')}</dt><dd>{roomsRange(s.rooms, l)}</dd></div>}
          {s.living_surface && <div><dt>{t('livingArea')}</dt><dd className="num">{s.living_surface.min === s.living_surface.max ? formatSurface(s.living_surface.min) : `${s.living_surface.min} – ${formatSurface(s.living_surface.max)}`}</dd></div>}
          {credits.map((x) => <div key={x.k}><dt>{x.k}</dt><dd>{x.v}</dd></div>)}
        </dl>
      </section>

      <section className="section section--paper" id="preise" aria-labelledby="h-preise">
        <div className="wrap">
          <div className="pa-head">
            <h2 id="h-preise" className="h2">{t('priceAvail')}</h2>
            <p className="muted">{t('asOf', { d: asOf })}</p>
          </div>
          <ul className="plain-list pa">
            {gs.map((g) => {
              const line = groupLine(g, l);
              return (
                <li key={g.key} className={!g.available.length ? 'pa--out' : undefined}>
                  <span className="pa__type">{g.label}</span>
                  <span className="pa__price num">{line.price ?? ''}</span>
                  <span className="pa__status">{line.status}</span>
                </li>
              );
            })}
          </ul>

          <div className="units">
            <div className="units__bar">
              <h3 className="h3">{t('table')}</h3>
              <label className="only"><input type="checkbox" id="only-available" /> {t('onlyAvailable')}</label>
            </div>
            <table className="ut">
              <caption className="sr-only">{t('table')}: {t('unitsAvailable', { n: s.available, t: s.units })}{reserved ? `, ${t('nReserved', { n: reserved })}` : ''}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('colUnit')}</th><th scope="col">{t('colFloor')}</th><th scope="col" className="r">{t('colRooms')}</th>
                  <th scope="col" className="r">{t('colArea')}</th><th scope="col" className="r">{t('colOut')}</th><th scope="col" className="r">{t('colPrice')}</th>
                  <th scope="col">{t('colStatus')}</th><th scope="col"><span className="sr-only">{t('plan')}</span></th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => {
                  const out = outdoor(u, l);
                  return (
                    <tr key={u.id} className={`st-${u.status}`} data-status={u.status}>
                      <th scope="row" className="num">{unitNo(u) ?? '–'}</th>
                      <td>{floorShort(u.floor, l, isAttic(u))}</td>
                      <td className="r num">{u.rooms != null && <><span className="d">{dec(u.rooms, l)}</span><span className="m">{rooms(u.rooms, l)}</span></>}</td>
                      <td className="r num">{u.living_surface != null ? formatSurface(u.living_surface) : ''}</td>
                      <td className="r num">{out ? `${formatSurface(out.m2)}` : ''}</td>
                      <td className="r num price">{unitPrice(u, l)}</td>
                      <td><span className={`pill pill--${u.status}`}>{statusLabel(u.status, l)}</span></td>
                      <td className="go"><a href={unitHref(d, u, l)} aria-label={`${t('unitN', { n: unitNo(u) ?? '' })}: ${statusLabel(u.status, l)}`}>{t('plan')} →</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {planTypes.length > 0 && (
        <section className="section wrap" id="plans" aria-labelledby="h-plans">
          <h2 id="h-plans" className="h2 sec-h">{t('plans')}</h2>
          <ul className="plain-list plans">
            {planTypes.map(({ g, src, u }) => (
              <li key={g.key}>
                <figure>
                  <a href={unitHref(d, (g.available[0] ?? u), l)}><img src={src} alt={t('planOf', { u: g.label })} width={560} height={440} loading="lazy" decoding="async" /></a>
                  <figcaption><span className="plans__name">{g.label}</span><span className="num">{g.units[0]?.living_surface ? formatSurface(Math.min(...g.units.map((x) => x.living_surface ?? Infinity))) : ''}</span></figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <p className="note">{t('planIndicative')}</p>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="section wrap gallery" aria-labelledby="h-photos">
          <h2 id="h-photos" className="h2 sec-h">{t('photos')}</h2>
          <ul className="plain-list photos">
            {gallery.map((p, i) => (
              <li key={i} className={i === 0 && gallery.length % 3 === 0 ? 'wide' : undefined}><Img src={p} alt={p.alt || `${d.title}, ${t('photo', { n: i + 2 })}`} width={i === 0 ? 1200 : 600} height={i === 0 ? 900 : 450} sizes={i === 0 ? '(min-width: 900px) 66vw, 100vw' : '(min-width: 900px) 33vw, 100vw'} /></li>
            ))}
          </ul>
        </section>
      )}

      {site.length > 0 && (
        <section className="section section--paper" aria-labelledby="h-site">
          <div className="wrap">
            <h2 id="h-site" className="h2 sec-h">{t('construction')}</h2>
            <ul className="plain-list site">
              {site.map((u, i) => <li key={u}><Img src={u} alt={`${d.title}: ${t('constructionNote')} ${i + 1}`} width={800} height={560} sizes="(min-width: 900px) 33vw, 100vw" /></li>)}
            </ul>
            <p className="note">{t('constructionNote')}</p>
          </div>
        </section>
      )}

      <section className="section wrap where" aria-labelledby="h-loc">
        <div className="where__text">
          <h2 id="h-loc" className="h2">{t('location')}</h2>
          <p>{where}</p>
          {docs.length > 0 && (
            <div id="docs" className="docs">
              <h3 className="h3">{t('documents')}</h3>
              <ul className="plain-list">
                {docs.map((x) => <li key={x.href}><a href={x.href} download=""><span>{x.label}</span><span className="muted">PDF, {x.size}</span></a></li>)}
              </ul>
            </div>
          )}
        </div>
        {d.address.lat != null && d.address.lng != null && (
          <StaticMap lat={d.address.lat} lng={d.address.lng} zoom={15} height={420} label={`${t('location')}: ${where}`} linkLabel={t('openMap')} />
        )}
      </section>

      <section className="contact on-green" id="contact" aria-labelledby="h-contact">
        <div className="wrap contact__in">
          <div className="contact__text">
            <h2 id="h-contact" className="h2">{t('devContact')}</h2>
            {agent && <div className="contact__agent"><AgentCard agent={agent} agents={agents} teams={teams} l={l} compact /></div>}
          </div>
          <div className="contact__form">
            <EnquiryForm locale={LOCALE[l]} developmentId={d.id} units={options} selectedUnit={selected} agentId={agent?.id} agentName={agent?.first_name} />
          </div>
        </div>
      </section>
    </Site>
  );
}
