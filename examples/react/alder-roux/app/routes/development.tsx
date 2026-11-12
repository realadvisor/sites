/**
 * One development: hero with key figures, description and credits,
 * documents, gallery, unit types with indicative plans, stacking plan and
 * unit table, location, broker and the development enquiry form (unit
 * select required, ?lot= preselects one).
 */
import type { Route } from './+types/development';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { sanitizeHtml } from '@realadvisor/sites-kit-core';
import { img } from '@realadvisor/sites-kit-core/image';
import { developmentStatus } from '@realadvisor/sites-kit-core/developments';
import { lang as klang, t as kt } from '@realadvisor/sites-kit-core/i18n';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { StackingPlan } from '../components/StackingPlan';
import { StaticMap } from '../components/StaticMap';
import { Img } from '../components/Img';
import { extras, live, siteData, sites } from '../lib/data.server';
import { agentSlug, href, langOf, LOCALE } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { formatAmount, formatSurface, monthYear, range, rooms, roomsRange, tel } from '../lib/format';
import { unitHref, unitInSentence, unitSelect, unitTypes } from '../lib/dev';
import { devDocs } from '../content/documents';
import './development.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const l = langOf(url.pathname);
  const dev = await sites.development(params.slug);
  if (!dev) throw notFound();
  const { org, agents, primary } = await siteData();
  const agent = dev.agents[0] ? (agents.find((a) => a.id === dev.agents[0]!.id) ?? dev.agents[0]) : undefined;
  return {
    l,
    dev,
    name: org.name,
    phone: primary?.phone,
    agent: agent && { ...agent, slug: agentSlug(agent, agents) },
    lot: url.searchParams.get('lot'),
    ex: extras('units', dev.units.map((u) => u.id)),
    docs: devDocs(dev.slug, l, live()), // fixture only: documents
  };
}

export default function Page({ loaderData: { l, dev, name, phone, agent, lot, ex, docs } }: Route.ComponentProps) {
  const t = tx(l);
  const locale = LOCALE[l];
  const types = unitTypes(dev.units, ex);
  const status = developmentStatus({ status: dev.status }, klang(locale));
  const city = cityName(dev.address.city, l);
  const chosen = dev.units.find((u) => u.id === lot && u.status !== 'sold');
  const options = unitSelect(dev.units, l, ex);
  const credits = [
    { k: t('developer'), v: dev.developer?.name },
    { k: t('architect'), v: dev.architect?.name },
    { k: t('contractor'), v: dev.general_contractor?.name },
  ].filter((c) => c.v);
  const figures = [
    dev.stats.units > 0 && { k: t('units'), v: t('unitsAvailable', { n: dev.stats.available, t: dev.stats.units }) },
    dev.stats.price?.min && { k: t('price'), v: t('priceFrom', { p: formatAmount(dev.stats.price.min) }) },
    dev.stats.rooms && { k: t('rooms'), v: roomsRange(dev.stats.rooms, l) },
    dev.stats.living_surface && { k: t('livingArea'), v: range(dev.stats.living_surface, (n) => formatSurface(n)) },
    dev.delivery_date && { k: t('delivery'), v: monthYear(dev.delivery_date, l) },
  ].filter(Boolean) as { k: string; v: string }[];
  const place = [dev.address.street, [dev.address.postcode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const message = chosen
    ? kt('unitInterested', { unit: unitInSentence(chosen, l), title: dev.title }, klang(locale))
    : kt('devInterested', { title: dev.title }, klang(locale));
  const tel1 = agent?.phone ?? phone;
  return (
    <Layout l={l} route="developments" segs={[dev.slug]}
      title={`${dev.title} · ${city} | ${name}`}
      description={(dev.description_text ?? dev.title).replace(/\s+/g, ' ').slice(0, 155)}
      image={dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 })}>

      <section className="hero">
        {dev.photos[0] && <Img src={dev.photos[0]} alt={dev.photos[0].alt || dev.title} width={1600} height={800} priority sizes="100vw" mobile={{ width: 800, height: 900 }} />}
        <div className="hero__shade"></div>
        <div className="wrap hero__copy on-navy">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navNew'), href: href('developments', l) }, { label: dev.title }]} />
          <span className="eyebrow">{[t('newBuild'), city, status].filter(Boolean).join(' · ')}</span>
          <h1 className="h1">{dev.title}</h1>
          <a className="button button--light" href="#disponibilites">{t('availability')}</a>
        </div>
      </section>

      {figures.length > 0 && (
        <section className="figbar">
          <dl className="wrap figbar__in">{figures.map((f) => <div key={f.k}><dt>{f.k}</dt><dd className="num">{f.v}</dd></div>)}</dl>
        </section>
      )}

      <section className="section">
        <div className="wrap intro">
          <div className="intro__main">
            {dev.description && <div className="prose lead" dangerouslySetInnerHTML={{ __html: sanitizeHtml(dev.description) }} />}
          </div>
          <div className="intro__side">
            {credits.length > 0 && (
              <div>
                <h2 className="side-h">{t('credits')}</h2>
                <dl className="kv">{credits.map((c) => <div key={c.k}><dt>{c.k}</dt><dd>{c.v}</dd></div>)}</dl>
              </div>
            )}
            {docs.length > 0 && (
              <div>
                <h2 className="side-h">{t('documents')}</h2>
                <ul className="docs">
                  {docs.map((d) => (
                    <li key={d.href}><a href={d.href} download><span>{d.kind === 'brochure' ? t('brochure') : t('priceList')}</span><span className="docs__t">{t('pdf')} · {d.size} ↓</span></a></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {dev.photos.length > 1 && (
        <section className={['wrap', 'gal', dev.photos.length === 3 && 'gal--2'].filter(Boolean).join(' ')} aria-label={t('photos')}>
          {dev.photos.slice(1, 4).map((p, i) => (
            <Img key={i} src={p} alt={p.alt || `${dev.title}, ${t('photo', { n: i + 2 })}`} width={900} height={600} sizes="(min-width: 900px) 46vw, 100vw" />
          ))}
        </section>
      )}

      {types.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="head"><h2 className="h2">{t('unitTypes')}</h2></div>
            <ul className="plain-list types">
              {types.map((ty) => {
                const avail = ty.units.filter((u) => u.status === 'available');
                const prices = avail.map((u) => u.price).filter((p): p is number => !!p);
                const surf = ty.units.map((u) => u.living_surface).filter((s): s is number => !!s);
                const target = avail[0] ?? ty.units[0]!;
                return (
                  <li key={ty.key} className="type">
                    <a href={unitHref(dev, target, l)}>
                      <span className="type__k">{t('typeName', { k: ty.letter })}</span>
                      <span className="type__plan">{ty.plan ? <img src={ty.plan(l)} alt={`${t('plan')} ${t('typeName', { k: ty.letter })}`} width={560} height={460} loading="lazy" /> : <span className="type__noplan">{rooms(target.rooms, l)}</span>}</span>
                      <span className="type__name">{rooms(target.rooms, l)}</span>
                      {surf.length > 0 && <span className="type__m num">{range({ min: Math.min(...surf), max: Math.max(...surf) }, (n) => formatSurface(n))}</span>}
                      <span className="type__p num">{prices.length ? t('priceFrom', { p: formatAmount(Math.min(...prices)) }) : t('sold')}</span>
                      <span className="type__n">{t('unitsAvailable', { n: avail.length, t: ty.units.length })}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="note">{t('planIndicative')}</p>
          </div>
        </section>
      )}

      {dev.units.length > 0 && (
        <section className="section section--paper" id="disponibilites">
          <div className="wrap">
            <div className="head"><div><h2 className="h2">{t('availability')}</h2><p className="lede">{t('availabilityLede')}</p></div></div>
            <StackingPlan dev={dev} l={l} ex={ex} />
          </div>
        </section>
      )}

      {dev.address.lat != null && dev.address.lng != null && (
        <section className="section">
          <div className="wrap loc">
            <div className="loc__txt">
              <span className="eyebrow">{t('location')}</span>
              <h2 className="h2">{city}</h2>
              {place && <p className="lede">{place}</p>}
            </div>
            <StaticMap lat={dev.address.lat} lng={dev.address.lng} zoom={14} height={420} area label={`${dev.title}, ${place}`} linkLabel={t('openMap')} />
          </div>
        </section>
      )}

      <section className="section section--paper" id="contact">
        <div className="wrap contact">
          <div className="contact__who">
            <h2 className="h2">{t('devContact')}</h2>
            {agent && (
              <div className="adv">
                {agent.photo?.url && <Img className="adv__photo" src={agent.photo} alt={`${agent.first_name} ${agent.last_name}`} width={128} height={160} sizes="64px" />}
                <div>
                  <p className="adv__name"><a href={href('team', l, agent.slug)}>{agent.first_name} {agent.last_name}</a></p>
                  {tel1 && <a className="num" href={tel(tel1)}>{tel1}</a>}
                </div>
              </div>
            )}
          </div>
          <div className="contact__form">
            <EnquiryForm locale={locale} developmentId={dev.id} units={options} selectedUnit={chosen?.id} agentName={agent?.first_name} message={message} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
