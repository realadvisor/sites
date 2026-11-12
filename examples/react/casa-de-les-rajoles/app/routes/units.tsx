/**
 * Units page (/viviendas, /en/homes): wing switch, a vertical floor rail for
 * the wing, the selected floor drawn as a plate (FloorPlate) with its units
 * listed beside it, then every unit in one table. State lives in the URL
 * (?ala=, ?planta=, ?solo=, ?tipo=): every control is a link and works
 * without JavaScript; app/client.ts only swaps the floor in place.
 */
import type { Route } from './+types/units';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { FloorPlate } from '../components/FloorPlate';
import { loadSite } from '../lib/data.server';
import { alternates, availCount, fill, href, langOfPath, longDate, tr } from '../lib/i18n';
import { KINDS, WINGS, floorOf, floorsOf, kindLabel, kindOf, sortUnits, unitRow, wingOf, type Kind, type Wing } from '../lib/units.server';
import { WING_ADDRESS } from '../content/site';
import { m2 } from '../lib/format';
import './units.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const lang = langOfPath(url.pathname);
  const t = tr(lang);
  const { dev } = await loadSite();
  const units = sortUnits(dev.units);
  const q = url.searchParams;
  const wing: Wing = q.get('ala') === 'nueva' ? 'nueva' : '1908';
  const avail = (us: typeof units) => us.filter((u) => u.status === 'available').length;
  const onFloor = (w: Wing, f: number) => units.filter((u) => wingOf(u) === w && (u.floor ?? 0) === f);
  /** Default floor of a wing: the one with most available units, the lower one on a tie. */
  const defaultFloor = (w: Wing) => {
    const fs = floorsOf(units, w);
    return [...fs].reverse().reduce((best, f) => (avail(onFloor(w, f)) > avail(onFloor(w, best)) ? f : best), fs[fs.length - 1] ?? 0);
  };
  const asked = Number(q.get('planta'));
  const floor = q.has('planta') && floorsOf(units, wing).includes(asked) ? asked : defaultFloor(wing);
  const solo = q.get('solo') === '1';
  const tipo = (KINDS as readonly string[]).includes(q.get('tipo') ?? '') ? (q.get('tipo') as Kind) : null;
  const tableUrl = (o: { solo?: boolean; tipo?: Kind | null }) => {
    const p = new URLSearchParams();
    if (q.get('ala')) p.set('ala', wing);
    if (q.has('planta')) p.set('planta', String(floor));
    if (o.solo ?? solo) p.set('solo', '1');
    const tp = o.tipo === undefined ? tipo : o.tipo;
    if (tp) p.set('tipo', tp);
    const s = p.toString();
    return `${href('units', lang)}${s ? `?${s}` : ''}#todas`;
  };
  const wings = WINGS.map((w) => {
    const us = units.filter((u) => wingOf(u) === w);
    const scale = Math.max(...floorsOf(units, w).map((f) => onFloor(w, f).reduce((s, u) => s + (u.living_surface ?? 0), 0)));
    return {
      w,
      meta: `${WING_ADDRESS[w]} · ${fill(t.wingCount, { n: us.length, a: avail(us) })}`,
      defaultFloor: defaultFloor(w),
      scale,
      floors: floorsOf(units, w).map((f) => {
        const n = avail(onFloor(w, f));
        return { f, label: floorOf(f, lang), n, avail: n ? availCount(n, lang) : t.floorNone, units: onFloor(w, f).map((u) => unitRow(u, lang)) };
      }),
    };
  });
  const today = new Date().toISOString().slice(0, 10);
  const description = fill(t.unitsLead, { n: dev.stats.units, a: dev.stats.available });
  return {
    lang,
    wing,
    floor,
    solo,
    tipo,
    wings,
    title: lang === 'es' ? `Viviendas en venta en Russafa | ${dev.title}` : `Homes for sale in Russafa | ${dev.title}`,
    description,
    metaDescription: `${dev.title}, ${dev.address.street}, ${dev.address.city}. ${description}`,
    image: dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 }),
    noindex: solo || !!tipo || q.has('ala') || q.has('planta'),
    updated: fill(t.updated, { d: longDate(today, lang) }),
    links: {
      all: tableUrl({ solo: false }),
      only: tableUrl({ solo: true }),
      anyType: tableUrl({ tipo: null }),
      reset: tableUrl({ solo: false, tipo: null }),
      kinds: KINDS.filter((k) => units.some((u) => kindOf(u) === k)).map((k) => ({ k, label: kindLabel(k, lang, 2), href: tableUrl({ tipo: k }) })),
    },
    table: units.filter((u) => (!solo || u.status === 'available') && (!tipo || kindOf(u) === tipo)).map((u) => unitRow(u, lang)),
  };
}

export default function Units({ loaderData: d }: Route.ComponentProps) {
  const { lang, wing, floor, solo, tipo } = d;
  const t = tr(lang);
  const floorUrl = (w: Wing, f: number) => `${href('units', lang)}?ala=${w}&planta=${f}#planta`;
  const wingUrl = (w: Wing) => `${href('units', lang)}?ala=${w}#planta`;
  const cell = (u: (typeof d.table)[number]) => (u.status === 'available' ? u.price : <span className={`pill ${u.status}`}>{u.statusLabel}</span>);
  return (
    <Layout lang={lang} route="units" title={d.title} description={d.metaDescription} image={d.image} alternates={alternates('units')} noindex={d.noindex} page="pg-units">
      <section className="wrap head">
        <h1>{t.unitsTitle}</h1>
        <p className="lede">{d.description}</p>
      </section>

      <section className="wrap explorer" id="planta" data-explorer="" aria-label={t.floorRail}>
        <nav className="wings" aria-label={t.wingSwitch}>
          {d.wings.map((x) => (
            <a key={x.w} href={wingUrl(x.w)} data-wing-link={x.w} aria-current={x.w === wing ? 'true' : undefined}>
              <span className="w-name">{t.wings[x.w]}</span>
              <span className="w-meta">{x.meta}</span>
            </a>
          ))}
        </nav>

        <div className="stage">
          {d.wings.map((x) => (
            <nav key={x.w} className="rail" aria-label={`${t.floorRail}, ${t.wings[x.w]}`} data-rail={x.w} data-default={x.defaultFloor} hidden={x.w !== wing}>
              <ol>
                {x.floors.map((fl) => (
                  <li key={fl.f}>
                    <a href={floorUrl(x.w, fl.f)} data-floor-link={`${x.w}:${fl.f}`} aria-current={x.w === wing && fl.f === floor ? 'true' : undefined} className={fl.n === 0 ? 'none' : undefined}>
                      <span className="f">{fl.label}</span>
                      <span className="n">{fl.avail}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ))}

          <div className="panels">
            {d.wings.flatMap((x) =>
              x.floors.map((fl) => (
                <div key={`${x.w}:${fl.f}`} className="panel" data-panel={`${x.w}:${fl.f}`} hidden={!(x.w === wing && fl.f === floor)}>
                  <div className="plate-col">
                    <h2>{fill(t.plateTitle, { f: fl.label, w: t.wings[x.w] })}</h2>
                    <FloorPlate units={fl.units} lang={lang} wing={x.w} scaleArea={x.scale} label={`${fl.label}, ${t.wings[x.w]}`} />
                    <div className="legend">
                      <span className="lg available">{t.status.available}</span>
                      <span className="lg reserved">{t.status.reserved}</span>
                      <span className="lg sold">{t.status.sold}</span>
                      <span className="note">{t.plateNote}</span>
                    </div>
                  </div>
                  <ul className="list">
                    {fl.units.map((u) => (
                      <li key={u.id} className={u.status} data-unit-row={u.id}>
                        <a href={u.href}>
                          <span className="no">{u.number}</span>
                          <span className="what">
                            <b>{u.what}</b>
                            <span className="facts num">{u.living ? m2(u.living) : null}{u.outdoor && ` · ${u.outdoorLabel.toLowerCase()} ${m2(u.outdoor.m2)}`}{u.orientation && ` · ${u.orientation}`}</span>
                          </span>
                          <span className={['price num', u.status !== 'available' && 'st'].filter(Boolean).join(' ')}>{cell(u)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )),
            )}
          </div>
        </div>
      </section>

      <section className="wrap table-sec" id="todas" aria-labelledby="todas-h">
        <div className="t-head">
          <h2 id="todas-h">{t.allUnits}</h2>
          <p className="muted small">{d.updated}</p>
        </div>
        <nav className="filters" aria-label={t.typeTabs}>
          <a href={d.links.all} aria-current={!solo ? 'true' : undefined}>{t.showAll}</a>
          <a href={d.links.only} aria-current={solo ? 'true' : undefined}>{t.onlyAvailable}</a>
          <span className="sep" aria-hidden="true"></span>
          <a href={d.links.anyType} aria-current={!tipo ? 'true' : undefined}>{lang === 'es' ? 'Todas las tipologías' : 'All types'}</a>
          {d.links.kinds.map((k) => <a key={k.k} href={k.href} aria-current={tipo === k.k ? 'true' : undefined}>{k.label}</a>)}
        </nav>
        {d.table.length === 0 ? (
          <p className="empty">{t.noneFilter} <a className="link" href={d.links.reset}>{t.showAll}</a></p>
        ) : (
          <table className="units">
            <thead>
              <tr>
                <th scope="col">{t.colNumber}</th>
                <th scope="col">{t.colType}</th>
                <th scope="col">{t.colWing}</th>
                <th scope="col">{t.colFloor}</th>
                <th scope="col" className="r">{t.colSize}</th>
                <th scope="col" className="r">{t.colOut}</th>
                <th scope="col">{t.colOrient}</th>
                <th scope="col" className="r">{t.colPrice}</th>
                <th scope="col"><span className="visually-hidden">{t.view}</span></th>
              </tr>
            </thead>
            <tbody>
              {d.table.map((u) => (
                <tr key={u.id} className={u.status}>
                  <td className="c-no num">{u.number}</td>
                  <td className="c-type"><a href={u.href}>{u.title}</a></td>
                  <td className="c-wing">{t.wings[u.wing]}</td>
                  <td className="c-floor">{u.floorOf}</td>
                  <td className="r num c-size">{u.living ? m2(u.living) : ''}</td>
                  <td className="r num c-out">{u.outdoor ? `${m2(u.outdoor.m2)}` : '–'}</td>
                  <td className="c-or">{u.orientation}</td>
                  <td className="r num c-price">{cell(u)}</td>
                  <td className="c-go"><a href={u.href} aria-label={`${t.viewUnit} ${u.number}`}>{t.view}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Layout>
  );
}
