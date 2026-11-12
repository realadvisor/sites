/**
 * Shortlist comparison, server-rendered from ?u=<id8>,<id8>,<id8> so it can be
 * shared and works without JS. Without ?u= the script fills it from the
 * stored shortlist. "Request info for these" opens the contact form with the
 * units named in the message.
 */
import type { Route } from './+types/compare';
import type { CSSProperties } from 'react';
import type { Unit } from '@realadvisor/sites-sdk/types';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { loadSite } from '../lib/data.server';
import { href, langOf } from '../lib/routes';
import { c } from '../lib/copy';
import {
  building, buildingName, floorName, formatRooms, hasPrice, outdoorLabel, outdoors, orientation, planKey, planSrc, shortId,
  statusLabel, unitLabel, unitNumber, unitPath, unitPrice, unitsFromIds,
} from '../lib/units';
import './compare.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const site = await loadSite(request);
  return { l: langOf(url.pathname), site, ids: unitsFromIds(site.dev, url.searchParams.get('u')).map((u) => u.id) };
}

export default function Compare({ loaderData: { l, site, ids: picks } }: Route.ComponentProps) {
  const { dev } = site;
  const all = dev.units;
  const picked = picks.map((id) => all.find((u) => u.id === id)!);
  const ids = picked.map(shortId);
  const without = (id: string) => {
    const rest = ids.filter((x) => x !== id);
    return rest.length ? `${href('compare', l)}?u=${rest.join(',')}` : href('compare', l);
  };
  const T = {
    it: {
      title: `Confronto dei preferiti | ${dev.title}`,
      h1: 'Confronto',
      intro: 'Fino a tre appartamenti affiancati. Salvali con la stella nell’elenco degli appartamenti.',
      empty: 'Non hai ancora salvato appartamenti.',
      toList: 'Vai agli appartamenti',
      ask: 'Richiedi informazioni su questi appartamenti',
      remove: 'Togli',
      share: 'Il link di questa pagina contiene la selezione e si può condividere.',
    },
    de: {
      title: `Vergleich der Merkliste | ${dev.title}`,
      h1: 'Vergleich',
      intro: 'Bis zu drei Wohnungen nebeneinander. Merken Sie sie mit dem Stern in der Wohnungsliste.',
      empty: 'Sie haben noch keine Wohnungen gemerkt.',
      toList: 'Zu den Wohnungen',
      ask: 'Informationen zu diesen Wohnungen anfordern',
      remove: 'Entfernen',
      share: 'Der Link dieser Seite enthält die Auswahl und lässt sich teilen.',
    },
  }[l];
  const rows: [string, (u: Unit) => string][] = [
    [c('house', l), (u) => buildingName(building(u), l)],
    [c('floor', l), (u) => floorName(u, l, all)],
    [c('rooms', l), (u) => formatRooms(u.rooms, l)],
    [c('livingArea', l), (u) => (u.living_surface ? `${u.living_surface} m²` : '–')],
    [c('outdoor', l), (u) => outdoors(u).map((o) => `${outdoorLabel(o, l)} ${o.m2} m²`).join(', ') || '–'],
    [c('bedrooms', l), (u) => (u.bedrooms != null ? String(u.bedrooms) : '–')],
    [c('bathrooms', l), (u) => (u.bathrooms != null ? String(u.bathrooms) : '–')],
    [c('orientation', l), (u) => orientation(u, l) || '–'],
    [c('price', l), (u) => (hasPrice(u) ? unitPrice(u, l) : '–')],
    [c('status', l), (u) => statusLabel(u, l)],
  ];
  const askable = picked.filter((u) => u.status !== 'sold');
  const cover = dev.photos[0];
  const status = c('status', l);
  return (
    <Layout l={l} route="compare" scope="v-compare" title={T.title} description={T.intro} noindex image={cover ? img(cover.url, { w: 1200, h: 630 }) : undefined}>
      <div className="wrap head">
        <h1 className="h1">{T.h1}</h1>
        <p className="lede">{T.intro}</p>
      </div>
      <div className="wrap body" data-compare="" data-has={picked.length ? '1' : undefined}>
        {picked.length === 0 ? (
          <div className="empty">
            <p>{T.empty}</p>
            <p><a className="btn" href={href('units', l)}>{T.toList}</a></p>
          </div>
        ) : (
          <>
            <div className="scroller">
              <table style={{ '--n': picked.length } as CSSProperties}>
                <caption className="sr-only">{T.h1}</caption>
                <thead>
                  <tr>
                    <td></td>
                    {picked.map((u) => {
                      const plan = planSrc(planKey(u, all), l, true);
                      return (
                        <th scope="col" key={u.id}>
                          {plan && <img src={plan} alt={`${c('indicativePlan', l)}: ${unitLabel(u, l, all)}`} width="320" height="240" loading="lazy" decoding="async" />}
                          <a href={unitPath(u, l)} className="no">{unitNumber(u) || formatRooms(u.rooms, l)}</a>
                          <span className="lbl">{unitLabel(u, l, all)}</span>
                          <a className="rm link" href={without(shortId(u))} data-remove={shortId(u)}>{T.remove}<span className="sr-only"> {unitNumber(u)}</span></a>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([k, f]) => (
                    <tr key={k}>
                      <th scope="row">{k}</th>
                      {picked.map((u) => <td key={u.id} className={k === status ? 'status' : undefined}>{k === status ? <span className={`pill ${u.status}`}>{f(u)}</span> : f(u)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="actions">
              {askable.length > 0 && <a className="btn" href={`${href('contact', l)}?u=${askable.map(shortId).join(',')}#richiesta`}>{T.ask}</a>}
              <a className="link" href={href('units', l)}>{T.toList}</a>
            </p>
            <p className="muted small">{T.share}</p>
          </>
        )}
      </div>
    </Layout>
  );
}
