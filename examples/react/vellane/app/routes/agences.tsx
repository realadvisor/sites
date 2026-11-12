/** Agencies: one card per team with its street photo, address, phone, people and listing count. */
import type { Route } from './+types/agences';
import { RaImage } from '../components/RaImage';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { siteData, sites } from '../lib/data.server';
import { joinFr, teamHref, teamShortName, teamSlug, tel } from '../lib/site';
import { placeFor } from '../content/places';
import './agences.css';

export async function loader() {
  const [{ org, teams, agents }, live] = await Promise.all([siteData(), sites.allListings({ status: 'available' })]);
  return {
    brand: org.name.replace(/\s+SAS$/, ''),
    nAgents: agents.length,
    teams: teams.map((t) => ({
      ...t,
      people: agents.filter((a) => a.team_ids.includes(t.id)).length,
      count: live.filter((l) => l.team_ids.includes(t.id)).length,
    })),
  };
}

const n = (x: number, one: string, many: string) => `${x} ${x > 1 ? many : one}`;

export default function Page({ loaderData: { brand, nAgents, teams } }: Route.ComponentProps) {
  const cities = [...new Set(teams.map((t) => t.address.city).filter(Boolean))] as string[];
  return (
    <Layout nav="agencies" title={`Nos agences à ${joinFr(cities)} | ${brand}`} description={`Les ${teams.length} agences ${brand} : adresses, téléphones, équipes et annonces à ${joinFr(cities)}.`}>
      <PageHead title="Nos agences" lede={`${teams.length} agences, ${n(nAgents, 'agent', 'agents')}, à ${joinFr(cities)}. Chaque agence vend et loue dans son secteur.`} />
      <ul className="wrap ags">
        {teams.map((t, i) => {
          const photo = placeFor(teamSlug(t))[i % 2] ?? placeFor(teamSlug(t))[0];
          return (
            <li key={t.id} className="agc">
              {photo && <RaImage className="agc__img" src={photo} alt={photo.alt ?? ''} width={800} height={500} sizes="(min-width: 960px) 620px, 100vw" priority={i === 0} />}
              <div className="agc__body">
                <h2 className="agc__name"><a href={teamHref(t)}>{teamShortName(t)}</a></h2>
                <address>
                  {t.address.street && <span>{t.address.street}</span>}
                  <span>{[t.address.postcode, t.address.city].filter(Boolean).join(' ')}</span>
                </address>
                <p className="agc__meta">{n(t.people, 'agent', 'agents')} · {n(t.count, 'annonce', 'annonces')}</p>
                <p className="agc__contact">
                  {t.phone && <a className="num" href={tel(t.phone)}>{t.phone}</a>}
                  {t.email && <a href={`mailto:${t.email}`}>{t.email}</a>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Layout>
  );
}
