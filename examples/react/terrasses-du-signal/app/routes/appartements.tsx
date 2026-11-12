// Units: the stacking plan of the building and the sortable table, filtered
// by rooms and "only available". Filters and sort are GET parameters (work
// without JS, shareable); a small script (units() in app/client.ts) applies them in place.
import type { Route } from './+types/appartements';
import type { Unit } from '@realadvisor/sites-sdk/types';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { StackingPlan } from '../components/StackingPlan';
import { ContactBand } from '../components/ContactBand';
import { Arrow } from '../components/Arrow';
import { TypeStrip } from '../components/TypeStrip';
import { loadSite } from '../lib/data.server';
import { deliveryLabel, floorName, formatSurface, orientation, outdoor, planFor, sortUnits, statusLabel, unitExtra, unitPath, unitPrice, unitTypes } from '../lib/units';
import { BROCHURE } from '../lib/nav';
import './appartements.css';

const SORTS = ['etage', 'pieces', 'surface', 'prix'] as const;
type Sort = (typeof SORTS)[number];

export async function loader({ request }: Route.LoaderArgs) {
  const site = await loadSite();
  const types = unitTypes(site.dev.units);
  const q = new URL(request.url).searchParams;
  const roomsParam = Number(q.get('pieces'));
  const rooms = types.some((t) => t.rooms === roomsParam) ? roomsParam : null;
  const sort: Sort = (SORTS as readonly string[]).includes(q.get('tri') ?? '') ? (q.get('tri') as Sort) : 'etage';
  return { site, types, rooms, onlyAvailable: q.get('dispo') === '1', sort, desc: q.get('ordre') === 'desc' };
}

export default function Units({ loaderData }: Route.ComponentProps) {
  const { site, types, rooms, onlyAvailable, sort, desc } = loaderData;
  const { dev, extras } = site;
  const key = (u: Unit): number => {
    if (sort === 'pieces') return u.rooms ?? 0;
    if (sort === 'surface') return u.living_surface ?? 0;
    if (sort === 'prix') return u.status === 'available' && u.price ? u.price : Number.MAX_SAFE_INTEGER;
    return (u.floor ?? 0) * 100 + (unitExtra(extras, u).position ?? 0); // fixture only: position on the floor
  };
  const MAX = Number.MAX_SAFE_INTEGER;
  // Units without a public price stay last in both directions.
  const rows = [...sortUnits(dev.units, extras)].sort((a, b) => {
    const ka = key(a), kb = key(b);
    if (ka === MAX || kb === MAX) return ka === kb ? 0 : ka === MAX ? 1 : -1;
    return (ka - kb) * (desc ? -1 : 1);
  });
  const match = (u: Unit) => (rooms == null || u.rooms === rooms) && (!onlyAvailable || u.status === 'available');
  const shown = dev.units.filter(match).length;
  const href = (p: Record<string, string | null>) => {
    const s = new URLSearchParams();
    const all = { pieces: rooms != null ? String(rooms) : null, dispo: onlyAvailable ? '1' : null, tri: sort === 'etage' ? null : sort, ordre: desc ? 'desc' : null, ...p };
    for (const [k, v] of Object.entries(all)) if (v) s.set(k, v);
    const str = s.toString();
    return `/appartements${str ? `?${str}` : ''}#lots`;
  };
  const sortHref = (s: Sort) => href({ tri: s === 'etage' ? null : s, ordre: sort === s && !desc ? 'desc' : null });
  const ariaSort = (s: Sort) => (sort === s ? (desc ? 'descending' : 'ascending') : undefined);
  const heading = rooms != null ? `Appartements de ${types.find((t) => t.rooms === rooms)!.label}` : 'Les appartements';
  const delivery = deliveryLabel(dev);
  return (
    <Layout
      title={`${heading}${onlyAvailable ? ' disponibles' : ''} | ${dev.title}`}
      description={`${dev.units.length} appartements du ${types[0]?.label ?? ''} au ${types[types.length - 1]?.label ?? ''} aux ${dev.title.replace(/^Les /, '')}, ${dev.address.city}. Plan de l’immeuble, surfaces, prix et disponibilités.`}
      image={dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 })}
    >
      <section className="intro wrap">
        <h1>{heading}{onlyAvailable && ' disponibles'}</h1>
        <p className="lede">Choisissez un lot dans l’immeuble ou dans la liste : plan, surfaces, orientation et prix sur sa page.{delivery && ` Livraison prévue en ${delivery}.`}</p>
      </section>

      <form className="filters wrap" method="get" action="/appartements#lots" data-filters="" aria-label="Filtrer les appartements">
        <fieldset className="types">
          <legend className="sr-only">Nombre de pièces</legend>
          <label className="chip"><input type="radio" name="pieces" value="" defaultChecked={rooms == null} /><span>Tous</span></label>
          {types.map((t) => (
            <label className="chip" key={t.rooms}>
              <input type="radio" name="pieces" value={String(t.rooms)} defaultChecked={rooms === t.rooms} />
              <span><b>{t.rooms}</b> pièces <small>{t.available.length} dispo.</small></span>
            </label>
          ))}
        </fieldset>
        <label className="only">
          <input type="checkbox" name="dispo" value="1" defaultChecked={onlyAvailable} />
          <span>Disponibles uniquement</span>
        </label>
        {sort !== 'etage' && <input type="hidden" name="tri" value={sort} />}
        {desc && <input type="hidden" name="ordre" value="desc" />}
        <button className="button ghost apply" type="submit" data-apply="">Afficher</button>
        <p className="count" aria-live="polite"><span data-count="">{shown}</span> <span data-count-label="">{shown > 1 ? 'lots' : 'lot'}</span> sur {dev.units.length}</p>
      </form>

      <section className="plan-sec wrap" aria-labelledby="plan-h">
        <h2 id="plan-h" className="sr-only">Plan de l’immeuble</h2>
        <div className="plan-grid">
          <StackingPlan units={dev.units} extras={extras} rooms={rooms} onlyAvailable={onlyAvailable} />
          <aside className="aside">
            <ul className="legend">
              <li><span className="sw available"></span>Disponible</li>
              <li><span className="sw reserved"></span>Réservé</li>
              <li><span className="sw sold"></span>Vendu</li>
            </ul>
            <p className="muted small">La largeur de chaque lot suit sa surface habitable. Les prix des lots réservés et vendus ne sont pas publiés.</p>
            <a className="link" href={BROCHURE} download>Brochure (PDF) <Arrow dir="down" /></a>
            <a className="link" href="/documents">Plans et liste de prix <Arrow /></a>
          </aside>
        </div>
      </section>

      <section className="table-sec wrap" id="lots" aria-labelledby="t-h">
        <h2 id="t-h">Liste des lots</h2>
        <div className="table" data-table="">
          <table>
            <thead>
              <tr>
                <th scope="col">Lot</th>
                <th scope="col" aria-sort={ariaSort('pieces')}><a href={sortHref('pieces')} data-sort="pieces">Pièces</a></th>
                <th scope="col" aria-sort={ariaSort('etage')}><a href={sortHref('etage')} data-sort="etage">Étage</a></th>
                <th scope="col" className="r" aria-sort={ariaSort('surface')}><a href={sortHref('surface')} data-sort="surface">Surface</a></th>
                <th scope="col" className="r">Extérieur</th>
                <th scope="col">Orientation</th>
                <th scope="col" className="r" aria-sort={ariaSort('prix')}><a href={sortHref('prix')} data-sort="prix">Prix</a></th>
                <th scope="col">Statut</th>
                <th scope="col"><span className="sr-only">Plan</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const x = unitExtra(extras, u); // fixture only: unit number, position
                const o = outdoor(u, extras);
                const plan = planFor(u, dev.units);
                return (
                  <tr
                    key={u.id}
                    className={[u.status, !match(u) && 'hide'].filter(Boolean).join(' ')}
                    data-row=""
                    data-rooms={u.rooms ?? undefined}
                    data-status={u.status}
                    data-k-etage={(u.floor ?? 0) * 100 + (x.position ?? 0)}
                    data-k-pieces={u.rooms ?? 0}
                    data-k-surface={u.living_surface ?? 0}
                    data-k-prix={u.status === 'available' && u.price ? u.price : ''}
                  >
                    <td className="no" data-l="Lot">{x.unit_number ?? '–'}</td>
                    <td className="rooms"><a href={unitPath(u)}>{u.rooms != null ? `${u.rooms} pièces` : 'Lot'}<span className="sr-only">, {floorName(u)}</span></a></td>
                    <td className="floor" data-l="Étage">{floorName(u)}</td>
                    <td className="r num surf" data-l="Surface">{formatSurface(u.living_surface)}</td>
                    <td className="r num out" data-l={o?.kind === 'garden' ? 'Jardin' : 'Terrasse'}>{o ? formatSurface(o.m2) : '–'}</td>
                    <td className="ori" data-l="Orientation">{orientation(u, extras) || '–'}</td>
                    <td className="r num price">{u.status === 'available' ? unitPrice(u) : '–'}</td>
                    <td className="st"><span className={`status ${u.status}`}>{statusLabel(u)}</span></td>
                    <td className="plan">{plan && <a href={unitPath(u)} className="plan-link" aria-label={`Plan et détails, ${u.rooms} pièces, ${floorName(u)}`}>Plan <Arrow /></a>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="empty" data-empty="" hidden={shown > 0}>Aucun lot ne correspond. <a href="/appartements#lots">Voir tous les lots</a></p>
        </div>
        <p className="note muted small">Surfaces habitables indicatives. Orientation, numéros de lot et surfaces extérieures selon les plans de vente.</p>
      </section>

      {types.length > 0 && (
        <section className="typologies" aria-labelledby="typ-h">
          <div className="wrap">
            <h2 id="typ-h">Plans par typologie</h2>
            <TypeStrip types={types} />
          </div>
        </section>
      )}

      <ContactBand site={site} heading="Réserver une visite de l’espace de vente" />
    </Layout>
  );
}
