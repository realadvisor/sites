// About the developer: written content (app/content/about.ts), figures
// computed from the data, the architects and builders per programme (fixture
// only) and the buying steps. No awards, no invented figures.
import { Fragment } from 'react';
import type { Route } from './+types/a-propos';
import { Layout } from '../components/Layout';
import { Hero } from '../components/Hero';
import { ContactBand } from '../components/ContactBand';
import { AgentPhoto } from '../components/AgentPhoto';
import { developmentExtra, primaryTeam, programmes as allProgrammes, sites } from '../lib/data.server';
import { contentFor } from '../content/programmes';
import { ABOUT } from '../content/about';
import { languageList, programmeStatus, programmeUrl, telHref } from '../lib/fr';
import { ogImage } from '../lib/seo';
import './a-propos.css';

export async function loader() {
  const [org, team, programmes, agents] = await Promise.all([sites.organisation(), primaryTeam(), allProgrammes(), sites.agents()]);
  const photoOf = (i: number) => {
    const d = programmes[i % Math.max(1, programmes.length)];
    return d ? (d.photos[contentFor(d.slug).hero ?? 0] ?? d.photos[0]) : undefined;
  };
  return {
    name: team?.name ?? org.name,
    team,
    programmes: programmes.map((d) => ({ id: d.id, slug: d.slug, title: d.title, status: d.status, address: { city: d.address.city } })),
    // Art direction: the delivered programme (last in the list) shows best what the developer builds.
    hero: photoOf(Math.max(0, programmes.length - 1)),
    // fixture only: developer, architect, general contractor
    credits: programmes
      .map((d) => ({ d: { slug: d.slug, title: d.title, city: d.address.city }, x: developmentExtra(d) }))
      .filter(({ x }) => x.architect || x.general_contractor)
      .map(({ d, x }) => ({ d, architect: x.architect, contractor: x.general_contractor })),
    team_: agents.map((a) => ({ a, ps: programmes.filter((d) => d.agents.some((x) => x.id === a.id)).map((d) => d.title) })),
  };
}

export default function About({ loaderData: { name, team, programmes, hero, credits, team_ } }: Route.ComponentProps) {
  return (
    <Layout
      title={`À propos | ${name}, promoteur immobilier`}
      description={`${name}, promoteur immobilier à Annecy et Lyon : qui nous sommes, nos architectes, l’achat d’un logement neuf et vos conseillers.`}
      image={ogImage(hero?.url)}
      current="about"
      hero={<Hero size="band" photo={hero?.url} alt={hero?.alt ?? name} kicker="À propos" title={name} line="Promoteur immobilier, bureau à Annecy, programmes en Haute-Savoie et dans le Rhône." />}
    >
      <section className="section" aria-labelledby="h-who">
        <div className="wrap ab-grid">
          <h2 id="h-who" className="display">Qui nous sommes</h2>
          <div className="ab-text">
            {ABOUT.intro.map((p, i) => <p key={i} className={i === 0 ? 'lead' : 'muted'}>{p}</p>)}
          </div>
        </div>
        <div className="wrap">
          <p className="muted ab-figs-note">Programmes présentés sur ce site : {programmes.map((d, i) => <Fragment key={d.id}>{i > 0 && ', '}<a href={programmeUrl(d)}>{d.title}</a> ({d.address.city}{programmeStatus(d) && `, ${programmeStatus(d).toLowerCase()}`})</Fragment>)}.</p>
        </div>
      </section>

      <section className="section section--deep" aria-labelledby="h-pr">
        <div className="wrap ab-grid">
          <h2 id="h-pr" className="display">Comment nous construisons</h2>
          <div className="ab-text ab-cols2">
            {ABOUT.approach.map((p, i) => <p key={i} className="muted">{p}</p>)}
          </div>
        </div>
      </section>

      {credits.length > 0 && (
        <section className="section" aria-labelledby="h-cr">
          <div className="wrap">
            <h2 id="h-cr" className="display">Architectes et entreprises</h2>
            <div className="ab-tablebox">
              <table className="ab-credits">
                <thead><tr><th scope="col">Programme</th><th scope="col">Architecte</th><th scope="col">Entreprise générale</th></tr></thead>
                <tbody>
                  {credits.map(({ d, architect, contractor }) => (
                    <tr key={d.slug}><th scope="row"><a href={programmeUrl(d)}>{d.title}</a><span className="muted"> · {d.city}</span></th><td>{architect ?? ''}</td><td>{contractor ?? ''}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section className="section section--paper" aria-labelledby="h-steps">
        <div className="wrap">
          <h2 id="h-steps" className="display">Acheter un logement neuf en VEFA</h2>
          <ol className="ab-steps">
            {ABOUT.steps.map((s, i) => (
              <li key={s.title} className="reveal"><span className="ab-sn num">{i + 1}</span><h3 className="ab-st">{s.title}</h3><p>{s.text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      {team_.length > 0 && (
        <section className="section section--tight" aria-labelledby="h-team">
          <div className="wrap">
            <h2 id="h-team" className="h3 ab-team-h">Vos interlocuteurs</h2>
            <ul className="ab-team">
              {team_.map(({ a, ps }) => (
                <li key={a.id}>
                  <AgentPhoto agent={a} size="card" />
                  <p className="ab-an">{a.first_name} {a.last_name}</p>
                  <p className="ab-ap muted">{ps.length > 0 ? `Ventes, ${ps.join(', ')}` : 'Ventes'}</p>
                  {a.languages?.length ? <p className="ab-ap muted">{languageList(a.languages)}</p> : null}
                  {a.phone && <a href={telHref(a.phone)} className="num">{a.phone}</a>}
                  {a.email && <a href={`mailto:${a.email}`}>{a.email}</a>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <ContactBand team={team} />
    </Layout>
  );
}
