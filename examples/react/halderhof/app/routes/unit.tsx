/**
 * Unit page, plan first: the indicative plan beside the unit's figures,
 * price (available units only) and status, the enquiry form for this unit,
 * its photos when it is also a listing, and other units of the same type.
 * Sold units are noindex.
 */
import type { Route } from './+types/unit';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { sanitizeHtml } from '@realadvisor/sites-kit-core';
import { featureLabel } from '@realadvisor/sites-kit-core/i18n';
import { img } from '@realadvisor/sites-kit-core/image';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { Crumbs } from '../components/Crumbs';
import { findUnit, siteData, unitExtras } from '../lib/data.server';
import { groups, isAttic, outdoor, planUrl, statusLabel, unitHref, unitLine, unitPrice, unitTitle } from '../lib/dev';
import { href, langOfPath, listingHref, LOCALE } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { dec, floor, formatSurface, orientation, orientationCode, tel } from '../lib/format';
import './unit.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const found = await findUnit(params.slug, params.unit);
  if (!found) throw notFound();
  const { dev: d, unit: u } = found;
  const { org } = await siteData();
  const ux = unitExtras(d.units);
  const g = groups(d.units, l, ux).find((x) => x.units.some((y) => y.id === u.id));
  const others = (g?.units ?? []).filter((y) => y.id !== u.id && y.status !== 'sold');
  const { units: _units, description: _d, description_text: _dt, ...dev } = d;
  return { l, unitSlug: params.unit, dev: { ...dev, photos: d.photos.slice(0, 1) }, u, others, orgName: org.name };
}

export default function UnitPage({ loaderData: { l, unitSlug, dev: d, u, others, orgName } }: Route.ComponentProps) {
  const t = tx(l);
  const title = unitTitle(u, l);
  const line = unitLine(u, l);
  const plan = planUrl(u, l);
  const out = outdoor(u, l);
  const aspect = orientation(orientationCode(u.orientation), l);
  const agent = d.agents[0];
  const city = cityName(d.address.city, l);
  const facts = [
    { k: t('rooms'), v: u.rooms != null ? dec(u.rooms, l) : '' },
    { k: t('livingArea'), v: u.living_surface != null ? formatSurface(u.living_surface) : '' },
    { k: out?.label ?? '', v: out ? formatSurface(out.m2) : '' },
    { k: t('floor'), v: floor(u.floor, l, isAttic(u)) },
    { k: t('bedrooms'), v: u.bedrooms != null ? String(u.bedrooms) : '' },
    { k: t('bathrooms'), v: u.bathrooms != null ? String(u.bathrooms) : '' },
    { k: t('orientation'), v: aspect },
  ].filter((f) => f.k && f.v);
  const priceText = unitPrice(u, l);
  const photos = u.photos ?? [];
  const og = photos[0] ?? d.photos[0];
  return (
    <Site l={l} route="developments" segs={[d.slug, unitSlug]} section="developments"
      title={`${title}, ${line} | ${d.title} | ${orgName}`} description={[d.title, city, line, priceText || statusLabel(u.status, l)].filter(Boolean).join(' · ')}
      image={og && img(og.url, { w: 1200, h: 630 })} noindex={u.status === 'sold'}>
      <div className="wrap top">
        <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navNew'), href: href('developments', l) }, { label: d.title, href: href('developments', l, d.slug) }, { label: title }]} />
        <div className="head">
          <div>
            <p className="kicker">{d.title} · {city}</p>
            <h1 className="h1">{title}</h1>
            <p className="line">{line}</p>
          </div>
          <div className="state">
            {priceText && <p className="price num">{priceText}</p>}
            <span className={`pill pill--${u.status}`}>{statusLabel(u.status, l)}</span>
          </div>
        </div>
      </div>

      <div className="wrap main">
        <figure className="plan">
          {plan
            ? <img src={plan} alt={t('planOf', { u: `${title}, ${line}` })} width={560} height={440} fetchPriority="high" />
            : <div className="plan__none">{t('plan')}</div>}
          <figcaption>{t('planIndicative')}</figcaption>
        </figure>
        <div className="side">
          <dl className="facts">{facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd className="num">{f.v}</dd></div>)}</dl>
          {u.status === 'sold' && <p className="note">{t('unitSoldNote')}</p>}
          {u.status === 'reserved' && <p className="note">{t('unitReservedNote')}</p>}
          {u.features.length > 0 && <p className="feats">{u.features.map((f) => featureLabel(f, LOCALE[l])).join(' · ')}</p>}
          {u.listing_slug && <a className="more" href={listingHref({ slug: u.listing_slug }, l)}>{t('seeListing')}</a>}
          <a className="more" href={`${href('developments', l, d.slug)}#preise`}>{t('backToDev')}</a>
        </div>
      </div>

      {(u.description || photos.length > 0) && (
        <section className="section wrap about" aria-label={t('description')}>
          {u.description && <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(u.description) }} />}
          {photos.length > 0 && (
            <ul className="plain-list photos">{photos.map((p, i) => <li key={i}><Img src={p} alt={p.alt || `${title}, ${t('photo', { n: i + 1 })}`} width={800} height={600} sizes="(min-width: 900px) 30vw, 50vw" /></li>)}</ul>
          )}
        </section>
      )}

      {u.status !== 'sold' && (
        <section className="contact on-green" id="contact" aria-labelledby="h-contact">
          <div className="wrap contact__in">
            <div className="contact__text">
              <h2 id="h-contact" className="h2">{t('askUnit')}</h2>
              <p className="lede">{d.title} · {title} · {line}</p>
              {agent && (
                <p className="agent">{agent.first_name} {agent.last_name}{agent.phone && <> · <a className="num" href={tel(agent.phone)}>{agent.phone}</a></>}</p>
              )}
            </div>
            <div className="contact__form">
              <EnquiryForm locale={LOCALE[l]} developmentId={d.id} lotId={u.id} agentId={agent?.id} agentName={agent?.first_name} submitLabel={t('askUnit')} />
            </div>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="section wrap" aria-labelledby="h-others">
          <h2 id="h-others" className="h3 sec-h">{t('otherUnits')}</h2>
          <ul className="plain-list others">
            {others.map((y) => (
              <li key={y.id}><a href={unitHref(d, y, l)}><span className="o__name">{unitTitle(y, l)}</span><span>{unitLine(y, l)}</span><span className="num">{y.living_surface ? formatSurface(y.living_surface) : ''}</span><span className="num o__price">{unitPrice(y, l) || statusLabel(y.status, l)}</span></a></li>
            ))}
          </ul>
        </section>
      )}
    </Site>
  );
}
