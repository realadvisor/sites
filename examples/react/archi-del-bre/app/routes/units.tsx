/**
 * Units: filters (GET, state in the URL), the axonometric drawing next to the
 * unit table, and the shortlist. The table is server-rendered and filtered on
 * the server, so it works without JS and is the accessible path; the script
 * (app/scripts/units-view.ts) filters in place, keeps the URL in sync, links
 * table rows and drawing on hover / focus, and runs the star buttons.
 * Phones: the table (as cards) first, the drawing after it.
 */
import type { Route } from './+types/units';
import type { Unit } from '@realadvisor/sites-sdk/types';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { IsoDrawing } from '../components/IsoDrawing';
import { loadSite } from '../lib/data.server';
import { href, langOf } from '../lib/routes';
import { c } from '../lib/copy';
import { isActive, matches, parseFilters, type UnitFacts } from '../lib/filters';
import {
  building, buildingName, deliveryLabel, floorName, floorShort, formatAmount, formatRooms, hasPrice, isPenthouse,
  mainOutdoor, outdoorLabel, shortId, sortUnits, statusLabel, unitNumber, unitPath, unitPrice, unitTitle,
} from '../lib/units';
import './units.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  return { l: langOf(url.pathname), site: await loadSite(request), f: parseFilters(url.searchParams) };
}

export default function Units({ loaderData: { l, site, f } }: Route.ComponentProps) {
  const { dev } = site;
  const all = dev.units;
  const facts = (u: Unit): UnitFacts => ({
    rooms: u.rooms != null ? String(u.rooms) : '',
    house: building(u),
    floor: String(u.floor ?? ''),
    top: isPenthouse(u, all),
    price: hasPrice(u) ? u.price! : null,
    status: u.status,
  });
  const units = sortUnits(all);
  const shown = units.filter((u) => matches(f, facts(u)));
  const houses = [...new Set(units.map(building).filter(Boolean))].sort();
  const groups = houses.length ? houses.map((h) => ({ h, units: units.filter((u) => building(u) === h) })) : [{ h: '', units }];
  const roomOpts = [...new Set(units.flatMap((u) => (u.rooms != null ? [u.rooms] : [])))].sort((a, b) => a - b);
  const floorOpts = [...new Set(units.filter((u) => !isPenthouse(u, all)).map((u) => u.floor ?? 0))].sort((a, b) => a - b);
  const hasTop = units.some((u) => isPenthouse(u, all));
  const priced = units.filter(hasPrice).map((u) => u.price!);
  const steps = [1250000, 1500000, 2000000, 2500000, 3000000].filter((p) => priced.some((x) => x <= p) && priced.some((x) => x > p));
  const T = {
    it: {
      title: `Appartamenti in vendita, ${dev.title}`,
      h1: 'Appartamenti',
      intro: `${all.length} appartamenti in ${houses.length === 2 ? 'due case' : 'una casa'}, ${all.filter((u) => u.status === 'available').length} disponibili. Consegna prevista ${deliveryLabel(dev, 'it')}.`,
      count: (n: number) => `${n} ${n === 1 ? 'appartamento' : 'appartamenti'}`,
      ofAll: `su ${all.length}`,
      filters: 'Filtri',
      table: `Appartamenti della ${dev.title}`,
      empty: 'Nessun appartamento corrisponde ai filtri.',
      shortlist: 'Preferiti',
      shortlistHint: 'Salva fino a 3 appartamenti con la stella per confrontarli.',
      priceNote: 'Prezzi in CHF, posto auto e cantina compresi secondo la descrizione. Per gli appartamenti riservati e venduti il prezzo non è pubblicato.',
      drawing: 'Le case',
    },
    de: {
      title: `Wohnungen zu verkaufen, ${dev.title}`,
      h1: 'Wohnungen',
      intro: `${all.length} Wohnungen in ${houses.length === 2 ? 'zwei Häusern' : 'einem Haus'}, ${all.filter((u) => u.status === 'available').length} verfügbar. Bezug geplant ${deliveryLabel(dev, 'de')}.`,
      count: (n: number) => `${n} ${n === 1 ? 'Wohnung' : 'Wohnungen'}`,
      ofAll: `von ${all.length}`,
      filters: 'Filter',
      table: `Wohnungen der ${dev.title}`,
      empty: 'Keine Wohnung entspricht den Filtern.',
      shortlist: 'Merkliste',
      shortlistHint: 'Bis zu 3 Wohnungen mit dem Stern merken und vergleichen.',
      priceNote: 'Preise in CHF, Parkplatz und Keller gemäss Beschrieb inbegriffen. Für reservierte und verkaufte Wohnungen wird kein Preis veröffentlicht.',
      drawing: 'Die Häuser',
    },
  }[l];
  const cover = dev.photos[0];
  const star = <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2.6 2.2 4.6 5 .6-3.7 3.5.9 5-4.4-2.4-4.4 2.4.9-5L2.8 7.8l5-.6z" /></svg>;
  return (
    <Layout l={l} route="units" scope="v-units" title={T.title} description={T.intro} image={cover ? img(cover.url, { w: 1200, h: 630 }) : undefined}>
      <div className="wrap head">
        <h1 className="h1">{T.h1}</h1>
        <p className="lede">{T.intro}</p>
      </div>

      <div className="wrap">
        <form className="filters" method="get" action={href('units', l)} data-filters="" aria-label={T.filters}>
          <label className="field">
            <span>{c('rooms', l)}</span>
            <select name="rooms" defaultValue={f.rooms}>
              <option value="">{c('all', l)}</option>
              {roomOpts.map((r) => <option key={r} value={String(r)}>{formatRooms(r, l)}</option>)}
            </select>
          </label>
          {houses.length > 1 && (
            <label className="field">
              <span>{c('house', l)}</span>
              <select name="house" defaultValue={f.house}>
                <option value="">{c('allF', l)}</option>
                {houses.map((h) => <option key={h} value={h}>{buildingName(h, l)}</option>)}
              </select>
            </label>
          )}
          <label className="field">
            <span>{c('floor', l)}</span>
            <select name="floor" defaultValue={f.floor}>
              <option value="">{c('all', l)}</option>
              {floorOpts.map((x) => <option key={x} value={String(x)}>{floorName({ floor: x } as Unit, l)}</option>)}
              {hasTop && <option value="top">{c('penthouse', l)}</option>}
            </select>
          </label>
          {steps.length > 0 && (
            <label className="field">
              <span>{c('maxPrice', l)}</span>
              <select name="max" defaultValue={f.max}>
                <option value="">{c('all', l)}</option>
                {steps.map((p) => <option key={p} value={String(p)}>{formatAmount(p)}</option>)}
              </select>
            </label>
          )}
          <label className="check">
            <input type="checkbox" name="avail" value="1" defaultChecked={f.avail} />
            <span>{c('onlyAvailable', l)}</span>
          </label>
          <div className="f-actions">
            <button className="btn" type="submit" data-submit="">{c('filter', l)}</button>
            <a className="link reset" href={href('units', l)} hidden={!isActive(f)} data-reset="">{c('reset', l)}</a>
          </div>
        </form>

        <div className="shortlist" data-shortlist="" hidden>
          <p><strong>{T.shortlist}</strong> <span data-shortlist-names=""></span></p>
          <p className="sl-actions">
            <a className="btn" href={href('compare', l)} data-shortlist-compare="">{c('compare', l)}</a>
            <button type="button" className="link" data-shortlist-clear="">{c('clear', l)}</button>
          </p>
        </div>
      </div>

      <div className="wrap layout">
        <section className="drawing" aria-labelledby="drawing-h">
          <h2 id="drawing-h" className="sr-only">{T.drawing}</h2>
          <IsoDrawing units={all} l={l} />
        </section>

        <section className="list" aria-labelledby="list-h">
          <h2 id="list-h" className="count" aria-live="polite" data-count="" data-of={T.ofAll} data-one={T.count(1)} data-many={T.count(2).replace(/^\d+ /, '')}>
            {T.count(shown.length)} {shown.length !== all.length && <span className="muted">{T.ofAll}</span>}
          </h2>
          <p className="hint muted" data-fav-hint="" hidden>{T.shortlistHint}</p>
          <table className="units" data-units="">
            <caption className="sr-only">{T.table}</caption>
            <thead>
              <tr>
                <th scope="col" className="c-fav"><span className="sr-only">{c('favourites', l)}</span></th>
                <th scope="col">{c('unitNo', l)}</th>
                <th scope="col">{c('floor', l)}</th>
                <th scope="col">{c('rooms', l)}</th>
                <th scope="col" className="r">{l === 'de' ? 'Fläche' : 'Superficie'}</th>
                <th scope="col" className="r">{c('outdoor', l)}</th>
                <th scope="col" className="r">{c('price', l)}</th>
                <th scope="col">{c('status', l)}</th>
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g.h} data-group={g.h}>
                {g.h && <tr className="group" hidden={!g.units.some((u) => shown.includes(u))}><th scope="rowgroup" colSpan={8}>{buildingName(g.h, l)}</th></tr>}
                {g.units.map((u) => {
                  const x = facts(u);
                  const o = mainOutdoor(u);
                  const num = unitNumber(u);
                  return (
                    <tr
                      key={u.id}
                      className={`row ${u.status}`}
                      hidden={!shown.includes(u)}
                      data-unit={shortId(u)}
                      data-rooms={x.rooms}
                      data-house={x.house}
                      data-floor={x.floor}
                      data-top={x.top ? '1' : undefined}
                      data-price={x.price ?? undefined}
                      data-status={u.status}
                    >
                      <td className="c-fav">
                        <button type="button" className="star" data-fav={shortId(u)} data-unit={num || formatRooms(u.rooms, l)} data-label-on={c('addFav', l)} data-label-off={c('removeFav', l)} data-label-full={c('favFull', l)} aria-pressed="false" hidden>
                          {star}
                        </button>
                      </td>
                      <td className="c-no"><a href={unitPath(u, l)} aria-label={unitTitle(u, l, all)}>{num || '–'}</a></td>
                      <td className="c-fl" data-l={c('floor', l)}><span className="full">{floorName(u, l, all)}</span><span className="short">{x.top ? c('penthouse', l) : floorShort(u, l)}</span></td>
                      <td className="c-r">{formatRooms(u.rooms, l)}</td>
                      <td className="r num c-s">{u.living_surface ? `${u.living_surface} m²` : '–'}</td>
                      <td className="r num c-o">{o ? <><span className="o-kind">{outdoorLabel(o, l)}</span> {o.m2} m²</> : '–'}</td>
                      <td className="r num c-p">{u.status === 'available' ? unitPrice(u, l) : ''}</td>
                      <td className="c-st"><span className={`pill ${u.status}`}>{statusLabel(u, l)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
          <p className="empty" data-empty="" hidden={shown.length > 0}>{T.empty} <a className="link" href={href('units', l)}>{c('reset', l)}</a></p>
          <p className="note muted">{T.priceNote}</p>
        </section>
      </div>
    </Layout>
  );
}
