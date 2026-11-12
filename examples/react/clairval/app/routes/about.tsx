/** About: who we are (from the data: offices, agents, languages), how a sale works, the offices. */
import type { Route } from './+types/about';
import { Site } from '../components/Site';
import { PageHead } from '../components/PageHead';
import { Img } from '../components/Img';
import { siteData } from '../lib/data.server';
import { href, langOfPath, teamSlug } from '../lib/routes';
import { cityName, joinList, languageName, tx } from '../lib/copy';
import { placeOf } from '../content/places';
import './about.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const { org, teams, agents } = await siteData();
  const hq = teams.find((x) => x.primary) ?? teams[0];
  const cities = joinList(teams.map((x) => cityName(x.address.city, l)).filter(Boolean), l);
  const langs = joinList([...new Set(agents.flatMap((a) => a.languages ?? []))].map((c) => languageName(c, l)), l);
  const photo = hq ? placeOf(teamSlug(hq, teams))?.photos[0] : undefined;
  return {
    l,
    orgName: org.name,
    cities,
    langs,
    nAgents: agents.length,
    hq: hq && { city: hq.address.city, street: hq.address.street },
    photo: photo && { url: photo.url, alt: photo.alt[l] },
    offices: teams.map((x) => ({ id: x.id, slug: teamSlug(x, teams), name: cityName(x.address.city, l) || x.name, street: x.address.street })),
  };
}

export default function About({ loaderData: d }: Route.ComponentProps) {
  const { l, orgName, cities, langs, hq } = d;
  const t = tx(l);
  const n = d.offices.length;
  const C = {
    en: {
      title: `About ${orgName}`,
      lede: `${orgName} sells and lets houses and apartments from ${n} offices: ${cities}.`,
      who: [
        `Our head office is in ${cityName(hq?.city, l)}, ${hq?.street ?? ''}. Each office works its own area with its own agents.`,
        `The team is ${d.nAgents} agents. Between them they speak ${langs}.`,
      ],
      how: 'How we sell a house',
      steps: [
        ['Visit and valuation', 'An agent of the office visits the house, studies the land register and the documents, and gives you a price with the reasons for it.'],
        ['Presentation', 'Photographs, a written description and the documents a buyer will ask for. Some houses are offered without photos or address, to a list of buyers we know.'],
        ['Viewings', 'Every viewing is accompanied. We tell you who visited and what they said.'],
        ['Offer and deed', 'We check the buyer’s financing, negotiate, and prepare the file for the notary up to the signing.'],
      ],
      offices: 'Our offices',
    },
    fr: {
      title: `À propos de ${orgName}`,
      lede: `${orgName} vend et loue des maisons et des appartements depuis ${n} bureaux : ${cities}.`,
      who: [
        `Notre siège est à ${cityName(hq?.city, l)}, ${hq?.street ?? ''}. Chaque bureau travaille son secteur avec ses propres agents.`,
        `L’équipe compte ${d.nAgents} agents. Ensemble, ils parlent ${langs}.`,
      ],
      how: 'Comment nous vendons une maison',
      steps: [
        ['Visite et estimation', 'Un agent du bureau visite la maison, étudie le registre foncier et les documents, et vous donne un prix avec ses raisons.'],
        ['Présentation', 'Photographies, description écrite et documents qu’un acheteur demandera. Certaines maisons sont proposées sans photos ni adresse, à des acheteurs que nous connaissons.'],
        ['Visites', 'Chaque visite est accompagnée. Nous vous disons qui est venu et ce qui a été dit.'],
        ['Offre et acte', 'Nous vérifions le financement de l’acheteur, négocions et préparons le dossier du notaire jusqu’à la signature.'],
      ],
      offices: 'Nos bureaux',
    },
  }[l];
  return (
    <Site l={l} route="about" title={C.title} description={C.lede}>
      <PageHead crumbLabel={t('breadcrumb')} crumbs={[{ label: t('home'), href: href('home', l) }, { label: t('navAbout') }]} title={C.title} lede={C.lede} />
      {d.photo && <div className="wrap pic"><Img src={d.photo.url} alt={d.photo.alt} width={1600} height={700} priority sizes="(min-width: 1440px) 1320px, 100vw" mobile={{ width: 800, height: 600 }} /></div>}
      <section className="wrap two">
        <div className="prose">{C.who.map((p, i) => <p key={i}>{p}</p>)}</div>
      </section>
      <section className="on-paper steps">
        <div className="wrap">
          <h2 className="h2">{C.how}</h2>
          <ol className="plain steps__list">
            {C.steps.map(([k, v]) => <li key={k}><h3>{k}</h3><p>{v}</p></li>)}
          </ol>
          <a className="cta" href={href('sell', l)}>{t('valuation')}</a>
        </div>
      </section>
      <section className="wrap offices">
        <h2 className="h3">{C.offices}</h2>
        <ul className="plain">
          {d.offices.map((x) => <li key={x.id}><a href={href('offices', l, x.slug)}><span>{x.name}</span><span className="muted">{x.street}</span></a></li>)}
        </ul>
      </section>
    </Site>
  );
}
