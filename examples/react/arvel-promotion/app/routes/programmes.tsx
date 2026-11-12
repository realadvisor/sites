// Programmes list: every programme with its status tag (from the CRM
// status), filtered by status with a GET link (?statut=construction).
import type { Route } from './+types/programmes';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { ContactBand } from '../components/ContactBand';
import { Photo } from '../components/Photo';
import { primaryTeam, programmes as allProgrammes } from '../lib/data.server';
import { contentFor } from '../content/programmes';
import { addressLine, deliveryText, plural, priceFrom, programmeStatus, programmeUrl, surfaceRange, typeRange, PROGRAMMES_PATH } from '../lib/fr';
import { ogImage } from '../lib/seo';
import './programmes.css';

export async function loader({ request }: Route.LoaderArgs) {
  const [all, team] = await Promise.all([allProgrammes(), primaryTeam()]);
  return { all, team, wanted: new URL(request.url).searchParams.get('statut') };
}

export default function Programmes({ loaderData: { all, team, wanted } }: Route.ComponentProps) {
  const statuses = [...new Set(all.map((d) => d.status).filter((s): s is NonNullable<typeof s> => !!s && !!programmeStatus({ status: s })))];
  const status = wanted && (statuses as string[]).includes(wanted) ? wanted : undefined;
  const list = status ? all.filter((d) => d.status === status) : all;
  const label = status ? programmeStatus({ status: status as (typeof statuses)[number] }).toLowerCase() : '';
  const title = `Nos programmes immobiliers neufs${label ? ` ${label}` : ''} | Arvel Promotion`;
  const cities = [...new Set(all.map((d) => d.address.city).filter(Boolean))];
  const first = list[0];
  return (
    <Layout title={title} description={`${plural(all.length, 'programme', 'programmes')} de logements neufs à ${cities.join(', ')} : statut, typologies, surfaces, livraison et prix.`} image={ogImage(first?.photos[contentFor(first.slug).hero ?? 0]?.url)} current="programmes" noindex={!!status}>
      <PageHead title="Nos programmes">
        <p className="lead pl-intro">{all.map((d) => `${d.title} à ${d.address.city} (${programmeStatus(d).toLowerCase()})`).join(', ')}.</p>
        {statuses.length > 1 && (
          <nav className="pl-filter" aria-label="Filtrer par statut">
            <a href={PROGRAMMES_PATH} aria-current={!status ? 'page' : undefined}>Tous <span className="num">{all.length}</span></a>
            {statuses.map((s) => (
              <a key={s} href={`${PROGRAMMES_PATH}?statut=${s}`} aria-current={status === s ? 'page' : undefined}>{programmeStatus({ status: s })} <span className="num">{all.filter((d) => d.status === s).length}</span></a>
            ))}
          </nav>
        )}
      </PageHead>

      <section className="section section--tight">
        <ol className="wrap pl-list">
          {list.map((d, i) => {
            const c = contentFor(d.slug);
            const photo = d.photos[c.hero ?? 0] ?? d.photos[0];
            const from = d.stats.available ? priceFrom(d) : '';
            const rows = [
              { k: 'Adresse', v: addressLine(d.address) },
              { k: 'Logements', v: d.stats.units ? `${d.stats.units}${d.stats.available ? `, dont ${d.stats.available} disponibles` : ', tous vendus ou réservés'}` : '' },
              { k: 'Typologies', v: typeRange(d.stats.rooms) },
              { k: 'Surfaces', v: surfaceRange(d.stats.living_surface) },
              { k: 'Livraison', v: deliveryText(d).replace(/^Livraison /, '') },
            ].filter((r) => r.v);
            return (
              <li key={d.id} className={i % 2 ? 'pl-card pl-flip' : 'pl-card'}>
                <a className="pl-media frame settle" href={programmeUrl(d)} tabIndex={-1} aria-hidden="true">
                  {photo && <Photo src={photo} alt="" width={1200} height={860} sizes="(min-width: 960px) 58vw, 100vw" priority={i === 0} />}
                  {programmeStatus(d) && <span className="tag" data-status={d.status}>{programmeStatus(d)}</span>}
                </a>
                <div className="pl-body reveal">
                  <p className="pl-city">{d.address.city}</p>
                  <h2 className="pl-t"><a href={programmeUrl(d)}>{d.title}</a></h2>
                  <dl>
                    {rows.map((r) => <div key={r.k}><dt>{r.k}</dt><dd>{r.v}</dd></div>)}
                  </dl>
                  {from && <p className="pl-from num">{from}</p>}
                  <div className="pl-actions">
                    <a className="button button--solid" href={programmeUrl(d)}>Découvrir<span className="sr-only"> {d.title}</span></a>
                    {d.stats.units > 0 && <a className="link" href={programmeUrl(d, 'logements')}>Les logements<span className="sr-only"> de {d.title}</span></a>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <ContactBand team={team} />
    </Layout>
  );
}
