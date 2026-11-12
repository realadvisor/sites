/**
 * Floor plans by typology (/planos, /en/floor-plans): tabs (links, ?tipo=),
 * each tab a card per plan variant with the plan, two big area figures
 * (interior, outdoor), "Ver plano" and the units of that variant, or
 * "Avísame" when every unit of it is sold or reserved. app/client.ts switches
 * tabs in place and opens a plan in a dialog; without it, links reload and
 * open the SVG.
 */
import type { Route } from './+types/plans';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { loadSite } from '../lib/data.server';
import { alternates, availCount, fill, href, langOfPath, tr } from '../lib/i18n';
import { docHref } from '../lib/docs';
import { KINDS, fmtRange, formatAmount, kindLabel, planSrc, planVariants, unitRow, type Kind } from '../lib/units.server';
import { WING_ADDRESS } from '../content/site';
import './plans.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const lang = langOfPath(url.pathname);
  const t = tr(lang);
  const { dev } = await loadSite();
  const variants = planVariants(dev.units);
  const kinds = KINDS.filter((k) => variants.some((v) => v.kind === k));
  const asked = url.searchParams.get('tipo');
  const current: Kind = (kinds as readonly string[]).includes(asked ?? '') ? (asked as Kind) : kinds[0]!;
  const variantTitle = (v: (typeof variants)[number]) =>
    v.kind === 'atico' ? `${t.kinds.atico[0]}, ${v.bedrooms === 1 ? t.bedroomsOne : fill(t.bedroomsN, { n: v.bedrooms })}` : kindLabel(v.kind, lang);
  const bathLabel = (v: (typeof variants)[number]) =>
    !v.bathrooms ? '' : v.bathrooms.max === 1 ? t.bathroomsOne : fill(t.bathroomsN, { n: fmtRange(v.bathrooms, String, lang === 'es' ? ' o ' : ' or ') });
  const cover = dev.photos.find((p) => p.url.includes('7851904')) ?? dev.photos[0];
  return {
    lang,
    current,
    title: `${t.plansTitle}: ${kindLabel(current, lang, 2)} | ${dev.title}`,
    description: `${t.plansTitle} ${dev.title}, Russafa. ${t.plansLead}`,
    image: cover && img(cover.url, { w: 1200, h: 630 }),
    noindex: !!asked && asked !== kinds[0],
    tabs: kinds.map((k) => {
      const n = variants.filter((v) => v.kind === k).reduce((s, v) => s + v.available.length, 0);
      return {
        k,
        label: kindLabel(k, lang, 2),
        n: n ? availCount(n, lang) : t.soldOut,
        variants: variants.filter((v) => v.kind === k).map((v) => ({
          key: v.key,
          kind: v.kind,
          wing: v.wing,
          title: variantTitle(v),
          where: `${t.wings[v.wing]} · ${WING_ADDRESS[v.wing]}${bathLabel(v) && ` · ${bathLabel(v)}`}`,
          full: planSrc(v.key, lang),
          fit: planSrc(v.key, lang, true),
          interior: fmtRange(v.interior),
          outdoor: v.outdoor ? fmtRange(v.outdoor) : null,
          outLabel: v.outdoorKind ? t.outdoor[v.outdoorKind].toLowerCase() : t.outdoor.none.toLowerCase(),
          available: v.available.length,
          availLabel: availCount(v.available.length, lang),
          priceFrom: v.priceFrom ? formatAmount(v.priceFrom) : null,
          unitsHref: v.available.length === 1 ? unitRow(v.available[0]!, lang).href : `${href('units', lang)}?tipo=${v.kind}#todas`,
          units: v.units.map((u) => unitRow(u, lang)),
        })),
      };
    }),
  };
}

export default function Plans({ loaderData: d }: Route.ComponentProps) {
  const { lang, current } = d;
  const t = tr(lang);
  const tabUrl = (k: Kind) => `${href('plans', lang)}?tipo=${k}#tipologias`;
  return (
    <Layout lang={lang} route="plans" title={d.title} description={d.description} image={d.image} alternates={alternates('plans')} noindex={d.noindex} page="pg-plans">
      <section className="head">
        <div className="wrap">
          <h1>{t.plansTitle}</h1>
          <p className="lede">{t.plansLead}</p>
          <a className="link dl" href={docHref('planos', lang)}>{t.plansPdf}</a>
        </div>
      </section>

      <div className="wrap" id="tipologias" data-tabs="">
        <nav className="tabs" aria-label={t.typeTabs}>
          {d.tabs.map((x) => (
            <a key={x.k} href={tabUrl(x.k)} data-tab={x.k} aria-current={x.k === current ? 'true' : undefined}>
              <span className="k">{x.label}</span>
              <span className="n">{x.n}</span>
            </a>
          ))}
        </nav>

        {d.tabs.map((x) => (
          <section key={x.k} className="tab" data-tab-panel={x.k} hidden={x.k !== current} aria-label={x.label}>
            {x.variants.map((v) => (
              <article className="type" key={v.key}>
                <a className="thumb" href={v.full} data-plan={v.full} data-plan-title={`${v.title} · ${t.wings[v.wing]}`}>
                  <img src={v.fit} alt={`${t.indicative} ${v.title}, ${t.wings[v.wing]}`} width="640" height="480" loading="lazy" decoding="async" />
                </a>
                <div className="body">
                  <h2>{v.title}</h2>
                  <p className="where">{v.where}</p>
                  <div className="figs">
                    <div><b className="num">{v.interior}<small>m²</small></b><span>{t.interior}</span></div>
                    <div><b className="num">{v.outdoor ? <>{v.outdoor}<small>m²</small></> : '–'}</b><span>{v.outLabel}</span></div>
                  </div>
                  <p className="avail">
                    {v.available
                      ? <><b>{v.availLabel}</b>{v.priceFrom && <> · {t.from}{' '}<b className="num">{v.priceFrom}</b></>}</>
                      : <span className="muted">{t.notifyText}</span>}
                  </p>
                  <div className="actions">
                    <a className="cta" href={v.full} data-plan={v.full} data-plan-title={`${v.title} · ${t.wings[v.wing]}`}>{t.viewPlan}</a>
                    {v.available
                      ? <a className="cta ghost" href={v.unitsHref}>{t.seeTypeUnits}</a>
                      : <a className="cta coral" href={`${href('contact', lang)}?aviso=${v.key}#consulta`}>{t.notify}</a>}
                  </div>
                  <ul className="units">
                    {v.units.map((u) => (
                      <li key={u.id}><a href={u.href}><span className="num">{u.number}</span> {u.floorName}</a> <span className={`pill ${u.status}`}>{u.statusLabel}</span></li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>

      <dialog className="viewer" data-viewer="" aria-label={t.viewPlan}>
        <div className="bar"><p data-viewer-title=""></p><button type="button" data-viewer-close="">{t.close}</button></div>
        <img data-viewer-img="" alt="" width="960" height="700" />
      </dialog>
    </Layout>
  );
}
