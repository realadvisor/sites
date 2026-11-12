/**
 * One unit of a development: indicative plan first, facts, price (only when
 * available), enquiry form filed on this unit (developmentId + lotId),
 * other units of the same type. Sold units are noindex.
 */
import type { Route } from './+types/unit';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { featureLabel, lang as klang, t as kt } from '@realadvisor/sites-kit/i18n';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { Img } from '../components/Img';
import { extras, findUnit, siteData } from '../lib/data.server';
import { agentSlug, href, langOf, LOCALE, unitSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { floor, formatSurface, orientation, price, rooms, tel } from '../lib/format';
import { outdoor, statusLabel, typeOf, unitHref, unitInSentence, unitLine, unitTitle, unitTypes } from '../lib/dev';
import './unit.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOf(new URL(request.url).pathname);
  const found = await findUnit(params.slug, params.unit);
  if (!found) throw notFound();
  const { org, agents } = await siteData();
  const { dev, unit } = found;
  const agent = dev.agents[0] ? (agents.find((a) => a.id === dev.agents[0]!.id) ?? dev.agents[0]) : undefined;
  return { l, dev, unit, name: org.name, agent: agent && { ...agent, slug: agentSlug(agent, agents) }, ex: extras('units', dev.units.map((u) => u.id)) };
}

export default function Page({ loaderData: { l, dev, unit: u, name, agent, ex } }: Route.ComponentProps) {
  const t = tx(l);
  const locale = LOCALE[l];
  const types = unitTypes(dev.units, ex);
  const type = typeOf(types, u);
  const title = unitTitle(u, l);
  const city = cityName(dev.address.city, l);
  const ori = orientation(u.orientation, l);
  const out = outdoor(u);
  const facts = [
    u.rooms != null && { k: t('rooms'), v: String(u.rooms) },
    u.bedrooms != null && { k: t('bedrooms'), v: String(u.bedrooms) },
    u.bathrooms != null && { k: t('bathrooms'), v: String(u.bathrooms) },
    u.living_surface != null && { k: t('livingArea'), v: formatSurface(u.living_surface) },
    out != null && { k: u.floor === 0 ? t('garden') : t('outdoor'), v: formatSurface(out) },
    u.floor != null && { k: t('floor'), v: floor(u.floor, l) },
    ori && { k: t('orientation'), v: ori },
  ].filter(Boolean) as { k: string; v: string }[];
  const siblings = (type?.units ?? []).filter((x) => x.id !== u.id);
  const available = u.status === 'available';
  const canAsk = u.status !== 'sold';
  return (
    <Layout l={l} route="developments" segs={[dev.slug, unitSlug(u)]}
      title={`${title} · ${dev.title} · ${unitLine(u, l)} | ${name}`}
      description={`${dev.title}, ${city}: ${unitLine(u, l)}, ${formatSurface(u.living_surface)} · ${available ? price({ ...u, status: 'available' }, l) : statusLabel(u.status, l)}`}
      image={dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 })}
      noindex={u.status === 'sold'}>
      <div className="wrap top">
        <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navNew'), href: href('developments', l) }, { label: dev.title, href: href('developments', l, dev.slug) }, { label: title }]} />
      </div>
      <div className="wrap unit">
        <figure className="plan">
          {type?.plan
            ? <img src={type.plan(l, u)} alt={t('planOf', { u: title })} width={560} height={460} />
            : <div className="plan__none">{rooms(u.rooms, l)}</div>}
          <figcaption>{type && <b>{t('typeName', { k: type.letter })}</b>} {t('planIndicative')}</figcaption>
        </figure>
        <div className="info">
          <span className="eyebrow">{dev.title} · {city}</span>
          <h1 className="h1 title">{title}</h1>
          <p className="sub">{unitLine(u, l)}</p>
          <div className="status">
            <span className={`pill pill--${u.status}`}>{statusLabel(u.status, l)}</span>
            {available && <span className="price num">{price({ ...u, status: 'available' }, l)}</span>}
          </div>
          {u.status === 'sold' && <p className="note">{t('unitSoldNote')}</p>}
          {u.status === 'reserved' && <p className="note">{t('unitReservedNote')}</p>}
          <dl className="kv">{facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}</dl>
          {u.features.length > 0 && <p className="feats">{u.features.map((f) => featureLabel(f, locale)).join(' · ')}</p>}
          {u.description && <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(u.description) }} />}
          <div className="ctas">
            {canAsk && <a className="button" href="#contact">{t('askUnit')}</a>}
            <a className="button button--ghost" href={href('developments', l, dev.slug)}>{t('backToDev')}</a>
          </div>
        </div>
      </div>

      {siblings.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="head"><div><h2 className="h2">{t('otherUnits')}</h2></div></div>
            <ul className="plain-list sibs">
              {siblings.map((s) => (
                <li key={s.id}>
                  <a href={unitHref(dev, s, l)}>
                    <span className="sibs__t">{unitTitle(s, l)}</span>
                    <span>{unitLine(s, l)} · {formatSurface(s.living_surface)}</span>
                    <span className={`pill pill--${s.status}`}>{statusLabel(s.status, l)}</span>
                    {s.status === 'available' && <span className="num sibs__p">{price({ ...s, status: 'available' }, l)}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section section--paper" id="contact">
        <div className="wrap contact">
          <div className="contact__who">
            <h2 className="h2">{canAsk ? t('askUnit') : t('devContact')}</h2>
            {agent && (
              <div className="adv">
                {agent.photo?.url && <Img className="adv__photo" src={agent.photo} alt={`${agent.first_name} ${agent.last_name}`} width={128} height={160} sizes="64px" />}
                <div>
                  <p className="adv__name"><a href={href('team', l, agent.slug)}>{agent.first_name} {agent.last_name}</a></p>
                  {agent.phone && <a className="num" href={tel(agent.phone)}>{agent.phone}</a>}
                </div>
              </div>
            )}
          </div>
          <div className="contact__form">
            {canAsk
              ? <EnquiryForm locale={locale} developmentId={dev.id} lotId={u.id} agentName={agent?.first_name} message={kt('unitInterested', { unit: unitInSentence(u, l), title: dev.title }, klang(locale))} />
              : <EnquiryForm locale={locale} developmentId={dev.id} units={dev.units.filter((x) => x.status !== 'sold').map((x) => ({ value: x.id, label: `${unitTitle(x, l)} · ${unitLine(x, l)}` }))} agentName={agent?.first_name} message={kt('devInterested', { title: dev.title }, klang(locale))} />}
          </div>
        </div>
      </section>
    </Layout>
  );
}
