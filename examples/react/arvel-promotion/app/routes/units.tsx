// Units: stacking plan by floor and the availability table, filtered by
// type (T1..T5) and "only available". The filter is a GET form (works and
// shares without JS: ?type=T3&dispo=1); units() in app/client.ts applies it live.
import type { Route } from './+types/units';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { Hero } from '../components/Hero';
import { StackingPlan } from '../components/StackingPlan';
import { UnitTable } from '../components/UnitTable';
import { EnquiryBlock } from '../components/EnquiryBlock';
import { sites, unitExtras } from '../lib/data.server';
import { contentFor } from '../content/programmes';
import { plural, programmeUrl, typeCode, typeMix } from '../lib/fr';
import { ogImage } from '../lib/seo';
import './units.css';

export async function loader({ params, request }: Route.LoaderArgs) {
  const d = await sites.development(params.slug);
  if (!d) throw notFound();
  const q = new URL(request.url).searchParams;
  return { d, extras: unitExtras(d), type: q.get('type'), dispo: q.get('dispo'), lot: q.get('lot') ?? undefined };
}

export default function Units({ loaderData: { d, extras, lot, ...q } }: Route.ComponentProps) {
  const c = contentFor(d.slug);
  const mix = typeMix(d);
  const type = mix.some((t) => t.code === q.type) ? q.type! : undefined;
  const onlyAvailable = q.dispo === '1';
  const shown = d.units.filter((u) => (!type || typeCode(u) === type) && (!onlyAvailable || u.status === 'available')).length;
  const photo = d.photos[(c.hero ?? 0) + 1] ?? d.photos[0];
  const filtered = [type, onlyAvailable && 'disponibles'].filter(Boolean).join(', ');
  const title = `Logements${filtered ? ` (${filtered})` : ''} · ${d.title} | Arvel Promotion`;
  const here = programmeUrl(d, 'logements');
  return (
    <Layout
      title={title}
      description={`${plural(d.stats.units, 'logement', 'logements')} de ${d.title}, dont ${d.stats.available} disponibles : plan de la résidence par étage, surfaces, orientations et prix.`}
      image={ogImage(photo?.url)}
      programme={d}
      section="units"
      current="programmes"
      noindex={!!(type || onlyAvailable || lot)}
      hero={<Hero size="band" photo={photo?.url} alt={photo?.alt ?? d.title} kicker={d.title} title="Les logements" line={d.stats.available ? `${d.stats.available} disponibles sur ${d.stats.units}` : `${d.stats.units} logements`} />}
    >
      <section className="section section--tight" aria-labelledby="h-plan">
        <div className="wrap">
          <form className="un-filters" method="get" action={here} data-unit-filters="" aria-label="Filtrer les logements">
            <fieldset className="un-types">
              <legend className="sr-only">Type de logement</legend>
              <label className="un-chip"><input type="radio" name="type" value="" defaultChecked={!type} /><span><b>Tous</b><small className="num">{d.stats.units}</small></span></label>
              {mix.map((t) => (
                <label key={t.code} className="un-chip">
                  <input type="radio" name="type" value={t.code} defaultChecked={type === t.code} />
                  <span><b>{t.code}</b><small className="num">{t.available ? `${t.available} dispo.` : 'complet'}</small></span>
                </label>
              ))}
            </fieldset>
            <label className="un-only"><input type="checkbox" name="dispo" value="1" defaultChecked={onlyAvailable} /><span>Seulement les disponibles</span></label>
            <button className="un-apply button" type="submit">Filtrer</button>
          </form>

          <div className="un-summary">
            <h2 id="h-plan" className="h3"><span data-unit-count="" className="num">{shown}</span> <span data-unit-count-label="">{shown > 1 ? 'logements' : 'logement'}</span> <span className="muted">sur {d.stats.units}</span></h2>
            <ul className="legend" aria-label="Légende">
              <li data-st="available">Disponible</li><li data-st="reserved">Réservé</li><li data-st="sold">Vendu</li>
            </ul>
          </div>
          <p className="un-empty" data-unit-empty="" hidden={shown > 0 || undefined}>Aucun logement ne correspond. <a href={here}>Voir tous les logements</a></p>

          <StackingPlan programme={d} extras={extras} type={type} onlyAvailable={onlyAvailable} labelledby="h-plan" />
          <p className="un-hint muted">Chaque bloc est un logement, sa largeur suit sa surface. Les prix sont affichés pour les logements disponibles.</p>

          <h2 className="h3 un-tbl-h" id="h-table">Tableau des logements</h2>
          <UnitTable programme={d} extras={extras} type={type} onlyAvailable={onlyAvailable} enquiryPath={here} />
        </div>
      </section>

      <EnquiryBlock programme={d} selectedUnit={lot} title="Un logement vous intéresse ?" />
    </Layout>
  );
}
