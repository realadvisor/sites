// Wohnungen: one stacking plan per building with a building picker, then the
// filterable table. Filters are GET parameters (shareable, work without JS);
// with JS they apply instantly and update the URL (app/client.ts: unitsFilter()).
import type { Route } from './+types/wohnungen';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { StackingPlan } from '../components/StackingPlan';
import { Icon } from '../components/Icon';
import { rowsOf, site as load } from '../lib/data.server';
import { buildings, chf, floorShort, matches, monthYear, netRent, parseFilters, rooms, statusLabel, surface, types, unitUrl } from '../lib/units';
import './wohnungen.css';

export async function loader({ request }: Route.LoaderArgs) {
  const { dev } = await load();
  const rows = rowsOf(dev);
  const f = parseFilters(new URL(request.url).searchParams);
  const rents = rows.map((r) => netRent(r.u)).filter((n): n is number => n != null);
  const titleParts = [f.zimmer != null ? `${String(f.zimmer)}-Zimmer-Wohnungen` : 'Mietwohnungen', f.haus ? `Haus ${f.haus}` : '', f.frei ? 'frei' : ''].filter(Boolean);
  return {
    meta: {
      title: `${titleParts.join(' · ')} | ${dev.title}, ${dev.address.city ?? ''}`.replace(/, $/, ''),
      description: `${dev.stats.units} Mietwohnungen in drei Häusern, ${dev.stats.available} frei. Stockwerkplan, Grundrisse, Mieten netto und Nebenkosten, Bezugstermine.`,
      image: dev.photos[1] && img(dev.photos[1].url, { w: 1200, h: 630 }),
    },
    stats: dev.stats,
    rows,
    f,
    floors: [...new Set(rows.map((r) => r.u.floor ?? 0))].sort((a, b) => a - b),
    moves: [...new Set(rows.map((r) => r.x.moveIn?.slice(0, 7)).filter((m): m is string => !!m))].sort(),
    steps: rents.length ? [1600, 2000, 2400, 2800, 3200].filter((s) => s >= Math.min(...rents)) : [],
    updated: new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
  };
}

export default function Wohnungen({ loaderData: d }: Route.ComponentProps) {
  const { rows, f, stats } = d;
  const houses = buildings(rows);
  const typeList = types(rows);
  const shown = rows.filter((r) => matches(r, f));
  const active = [f.haus, f.zimmer, f.maxMiete, f.geschoss, f.bezug, f.frei || undefined].some((v) => v != null);
  return (
    <Layout page="wohnungen" {...d.meta}>
      <section className="head">
        <div className="wrap head-in">
          <div>
            <h1>Wohnungen</h1>
          </div>
          <dl className="tally">
            <div><dt>frei</dt><dd className="num">{stats.available}</dd></div>
            <div><dt>reserviert</dt><dd className="num">{stats.reserved}</dd></div>
            <div><dt>vermietet</dt><dd className="num">{stats.sold}</dd></div>
          </dl>
        </div>
      </section>

      <form className="filters wrap" method="get" action="/wohnungen" data-filters="" aria-label="Wohnungen filtern">
        <fieldset className="picker">
          <legend className="visually-hidden">Haus</legend>
          <label className="seg"><input type="radio" name="haus" value="" defaultChecked={!f.haus} /><span>Alle Häuser</span></label>
          {houses.map((h) => (
            <label className={`seg seg--${h.key.toLowerCase()}`} key={h.key}>
              <input type="radio" name="haus" value={h.key} defaultChecked={f.haus === h.key} />
              <span>{h.name} <small className="num">{h.available} frei</small></span>
            </label>
          ))}
        </fieldset>
        <div className="row">
          <fieldset className="chips">
            <legend className="flabel">Zimmer</legend>
            <label className="chip"><input type="radio" name="zimmer" value="" defaultChecked={f.zimmer == null} /><span>Alle</span></label>
            {typeList.map((t) => (
              <label className="chip" key={t.rooms}><input type="radio" name="zimmer" value={String(t.rooms)} defaultChecked={f.zimmer === t.rooms} /><span className="num">{String(t.rooms)}</span></label>
            ))}
          </fieldset>
          <label className="sel">
            <span className="flabel">Miete netto bis</span>
            <select name="miete" defaultValue={f.maxMiete != null && d.steps.includes(f.maxMiete) ? String(f.maxMiete) : ''}>
              <option value="">Alle</option>
              {d.steps.map((s) => <option key={s} value={s}>{chf(s)}</option>)}
            </select>
          </label>
          <label className="sel">
            <span className="flabel">Geschoss</span>
            <select name="geschoss" defaultValue={f.geschoss != null && d.floors.includes(f.geschoss) ? String(f.geschoss) : ''}>
              <option value="">Alle</option>
              {d.floors.map((n) => <option key={n} value={n}>{n === 0 ? 'Erdgeschoss' : `${n}. Obergeschoss`}</option>)}
            </select>
          </label>
          <label className="sel">
            <span className="flabel">Bezug</span>
            <select name="bezug" defaultValue={f.bezug && d.moves.includes(f.bezug) ? f.bezug : ''}>
              <option value="">Alle</option>
              {d.moves.map((m) => <option key={m} value={m}>ab {monthYear(`${m}-01`)}</option>)}
            </select>
          </label>
          <label className="switch">
            <input type="checkbox" name="frei" value="1" defaultChecked={f.frei} />
            <span className="track" aria-hidden="true"></span>
            <span>Nur freie</span>
          </label>
          <div className="form-actions">
            <button className="cta" type="submit" data-apply="">Anwenden</button>
            <a className="reset" href="/wohnungen" data-reset="" hidden={!active}>Zurücksetzen</a>
          </div>
        </div>
        <p className="result" aria-live="polite"><strong className="num" data-count="">{shown.length}</strong> <span data-count-word="">{shown.length === 1 ? 'Wohnung' : 'Wohnungen'}</span> · Stand {d.updated}</p>
      </form>

      <section className="plans wrap" aria-label="Stockwerkplan">
        <div className="legend" aria-hidden="true">
          <span className="lg lg--free">Frei</span><span className="lg lg--res">Reserviert</span><span className="lg lg--let">Vermietet</span>
          <span className="hint">Grössere Wohnungen, breitere Felder</span>
        </div>
        <div className="buildings">
          {houses.map((h) => (
            <div className="building" data-building-panel={h.key} hidden={!!f.haus && f.haus !== h.key} key={h.key}>
              <StackingPlan building={h} filters={f} />
            </div>
          ))}
        </div>
      </section>

      <section className="list wrap" aria-labelledby="list-title">
        <h2 id="list-title" className="list-title">Alle Wohnungen im Überblick</h2>
        <table className="table">
          <caption className="visually-hidden">Alle Wohnungen mit Zimmern, Fläche, Geschoss, Bezug, Miete und Status</caption>
          <thead>
            <tr>
              <th scope="col">Wohnung</th>
              <th scope="col">Zimmer</th>
              <th scope="col">Fläche</th>
              <th scope="col">Aussen</th>
              <th scope="col">Geschoss</th>
              <th scope="col">Bezug</th>
              <th scope="col" className="r">Netto</th>
              <th scope="col" className="r">NK</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rent = netRent(r.u);
              return (
                <tr
                  key={r.u.id}
                  className={`st-${r.u.status}`}
                  hidden={!matches(r, f)}
                  data-row=""
                  data-status={r.u.status}
                  data-rooms={r.u.rooms}
                  data-rent={rent ?? ''}
                  data-floor={r.u.floor ?? 0}
                  data-movein={r.x.moveIn?.slice(0, 7) ?? ''}
                  data-haus={r.x.building}
                >
                  {/* fixture only: unit number, building, move-in date, charges */}
                  <td className="c-name">
                    <a className="row-link" href={unitUrl(r.u)} aria-label={r.u.name}><b className="num">{r.x.number}</b></a>{' '}
                    <span className="c-house">Haus {r.x.building}</span>{' '}
                    <span className="m-meta">{[floorShort(r.u), surface(r.u.living_surface), r.x.moveIn ? `Bezug ${monthYear(r.x.moveIn)}` : ''].filter(Boolean).join(' · ')}</span>
                  </td>
                  <td className="c-rooms num">{rooms(r.u)}</td>
                  <td className="num c-area">{surface(r.u.living_surface)}</td>
                  <td className="num c-out">{r.u.balcony_surface ? surface(r.u.balcony_surface) : ''}</td>
                  <td className="c-floor">{floorShort(r.u)}</td>
                  <td className="c-move">{monthYear(r.x.moveIn)}</td>
                  <td className="r num c-rent">{rent ? chf(rent) : ''}</td>
                  <td className="r num c-nk">{rent && r.x.charges ? chf(r.x.charges) : ''}</td>
                  <td className="c-st"><span className={`pill pill--${r.u.status}`}>{statusLabel(r.u)}</span><Icon name="arrow" className="go" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="empty" data-empty="" hidden={shown.length > 0}>
          <p><strong>Keine Wohnung passt zu diesen Filtern.</strong> Lockern Sie die Auswahl, oder melden Sie Ihr Interesse an: Wir informieren Sie, wenn eine passende Wohnung frei wird.</p>
          <div className="empty-actions"><a className="cta cta--ghost" href="/wohnungen">Filter zurücksetzen</a><a className="cta cta--zinnober" href="/kontakt">Interesse anmelden</a></div>
        </div>
        <p className="note muted">Mieten pro Monat. Netto = Nettomiete, NK = Nebenkosten (Akonto). Reservierte Wohnungen mit Mietzins (Warteliste möglich), vermietete ohne. Alle Angaben ohne Gewähr.</p>
      </section>
    </Layout>
  );
}
