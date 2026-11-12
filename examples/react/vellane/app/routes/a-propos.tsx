/** About: who we are, in plain sentences, with figures computed from the data only. */
import type { Route } from './+types/a-propos';
import { RaImage } from '../components/RaImage';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { siteData, sites } from '../lib/data.server';
import { joinFr, R, searchUrl, teamHref, teamShortName } from '../lib/site';
import { PLACES } from '../content/places';
import './a-propos.css';

export async function loader() {
  const [{ org, teams, agents }, all] = await Promise.all([siteData(), sites.allListings()]);
  const live = all.filter((l) => l.status === 'available');
  return {
    brand: org.name.replace(/\s+SAS$/, ''),
    teams,
    nAgents: agents.length,
    nLive: live.length,
    towns: [...new Set(live.map((l) => l.address.city).filter(Boolean))] as string[],
  };
}

export default function Page({ loaderData: { brand, teams, nAgents, nLive, towns } }: Route.ComponentProps) {
  const cities = [...new Set(teams.map((t) => t.address.city).filter(Boolean))] as string[];
  const photos = [PLACES['lyon-presquile']?.[0], PLACES['bordeaux']?.[0]].filter(Boolean);
  return (
    <Layout title={`À propos | ${brand}`} description={`${brand} : ${teams.length} agences immobilières à ${joinFr(cities)}, pour acheter, vendre et louer.`}>
      <PageHead title={`${brand}, à ${joinFr(cities)}`} />
      <div className="wrap about">
        <div className="about__text">
          <p className="lede-strong">Nous sommes {nAgents} agents dans {teams.length} agences, à {joinFr(cities)}. Chacun travaille dans le secteur de son agence.</p>
          <ul className="about__teams">
            {teams.map((t) => (
              <li key={t.id}>
                <a className="link" href={teamHref(t)}>{teamShortName(t)}</a>
                {t.description_text ? <span>{t.description_text}</span> : <span className="muted">{[t.address.street, t.address.city].filter(Boolean).join(', ')}</span>}
              </li>
            ))}
          </ul>
          <p>Nous vendons surtout de l'ancien : appartements en pierre, appartements de canuts, échoppes, maisons avec jardin. Nous louons aussi, principalement des appartements meublés et vides en centre-ville.</p>
          <p>Toutes nos annonces sont sur ce site, avec leur DPE, leur adresse approximative et le contact direct de l'agent. En ce moment : {nLive} biens à {joinFr(towns)}.</p>
          <p className="about__links">
            <a className="vb" href={searchUrl('buy')}>Voir les annonces</a>
            <a className="vb vb--ghost" href={R.agencies}>Nos agences</a>
          </p>
        </div>
        <div className="about__photos">
          {photos.map((p, i) => p && <RaImage key={i} src={p} alt={p.alt ?? ''} width={800} height={1000} sizes="(min-width: 960px) 260px, 50vw" priority={i === 0} />)}
        </div>
      </div>
    </Layout>
  );
}
