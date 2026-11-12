import type { Route } from './+types/home';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Layout } from '../components/Layout';
import { Hero } from '../components/Hero';
import { ProgrammePanel } from '../components/ProgrammePanel';
import { ContactBand } from '../components/ContactBand';
import { primaryTeam, programmes as allProgrammes, sites } from '../lib/data.server';
import { contentFor, HOME_HERO } from '../content/programmes';
import { ABOUT } from '../content/about';
import { deliveryText, plural, programmeUrl, PROGRAMMES_PATH } from '../lib/fr';
import { organisationJsonLd, ogImage } from '../lib/seo';
import './home.css';

export async function loader() {
  const [org, team, programmes] = await Promise.all([sites.organisation(), primaryTeam(), allProgrammes()]);
  return { org, team, programmes, jsonLd: organisationJsonLd(org, team, siteUrl()) };
}

const NUM = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
const count = (n: number) => NUM[n] ?? String(n);

export default function Home({ loaderData: { org, team, programmes, jsonLd } }: Route.ComponentProps) {
  const name = team?.name ?? org.name;
  const lead = programmes[0];
  const leadPhoto = lead ? (lead.photos[contentFor(lead.slug).hero ?? 0] ?? lead.photos[0]) : undefined;
  const cities = [...new Set(programmes.map((d) => d.address.city).filter(Boolean))];
  const cityList = cities.length > 1 ? `${cities.slice(0, -1).join(', ')} et ${cities.at(-1)}` : (cities[0] ?? '');
  // One plain sentence per programme, from the data: where, how many homes, where it stands.
  const stage = (d: (typeof programmes)[number]) =>
    d.status === 'delivered' ? `${deliveryText(d).toLowerCase()}${d.stats.available ? `, ${plural(d.stats.available, 'logement encore disponible', 'logements encore disponibles')}` : ''}`
    : d.status === 'construction' ? `en travaux, ${deliveryText(d).toLowerCase()}`
    : `en vente, ${deliveryText(d).toLowerCase()}`;
  const heroTitle = `Logements neufs à ${cityList}`;
  const sizes = programmes.map((d) => d.stats.units).filter((n) => n > 0);
  const heroLead = programmes.length
    ? `${name} construit ${count(programmes.length)} ${programmes.length > 1 ? 'résidences' : 'résidence'}${sizes.length > 1 ? `, de ${Math.min(...sizes)} à ${Math.max(...sizes)} logements` : ''}.`
    : '';
  const title = `${name} | Promoteur immobilier ${cities.slice(0, 2).join(' et ')}`;
  const description = `${name}, promoteur immobilier à ${cityList} : ${programmes.map((d) => `${d.title} (${d.address.city})`).join(', ')}. Plans, prix et logements disponibles.`;
  return (
    <Layout
      title={title}
      description={description}
      image={ogImage(leadPhoto?.url)}
      jsonLd={jsonLd}
      current="home"
      hero={
        <Hero local={HOME_HERO.local} alt={HOME_HERO.alt} title={heroTitle}>
          {heroLead && <p className="hero-lead">{heroLead}</p>}
          {programmes.length > 0 && (
            <ul className="hero-list">
              {programmes.map((d) => (
                <li key={d.id}><a href={programmeUrl(d)}><span className="hl-t">{d.title}</span><span className="hl-m">{d.address.city} · {d.stats.units} logements · {stage(d)}</span></a></li>
              ))}
            </ul>
          )}
        </Hero>
      }
    >
      <section className="section section--paper hm-intro" aria-labelledby="h-intro">
        <div className="wrap hm-intro-grid">
          <h2 id="h-intro" className="sr-only">Qui nous sommes</h2>
          <p className="hm-statement">{ABOUT.intro[0]}</p>
          <div className="hm-intro-side">
            <p className="muted">{ABOUT.intro[1]}</p>
            <a className="link" href="/a-propos">Qui nous sommes</a>
          </div>
        </div>
      </section>

      {programmes.length > 0 && (
        <section className="hm-programmes" aria-labelledby="h-programmes">
          <div className="wrap hm-head">
            <h2 id="h-programmes" className="display">Les programmes</h2>
            <a className="link" href={PROGRAMMES_PATH}>{programmes.length > 1 ? `Comparer les ${count(programmes.length)}` : 'Le détail'}</a>
          </div>
          {programmes.map((d, i) => <ProgrammePanel key={d.id} programme={d} index={i} />)}
        </section>
      )}

      <ContactBand team={team} />
    </Layout>
  );
}
