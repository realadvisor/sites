/** One agent: contact, agency, bio when set, their listings and sales, and a form addressed to them. */
import type { Route } from './+types/equipe-slug';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { RaImage } from '../components/RaImage';
import { Layout } from '../components/Layout';
import { ListingCard } from '../components/ListingCard';
import { Icon } from '../components/Icon';
import { siteData, sites } from '../lib/data.server';
import { agentName, agentSlug, languages, R, teamHref, teamShortName, tel } from '../lib/site';
import './equipe-slug.css';

export async function loader({ params }: Route.LoaderArgs) {
  const { org, teams, agents } = await siteData();
  const agent = agents.find((a) => agentSlug(a) === params.slug);
  if (!agent) throw notFound();
  const all = await sites.allListings();
  const mine = all.filter((l) => l.agent?.id === agent.id);
  return {
    brand: org.name.replace(/\s+SAS$/, ''),
    agent,
    team: teams.find((t) => agent.team_ids.includes(t.id)),
    live: mine.filter((l) => l.status === 'available'),
    sold: mine.filter((l) => l.status === 'sold'),
  };
}

export default function Page({ loaderData: { brand, agent, team, live, sold } }: Route.ComponentProps) {
  const name = agentName(agent);
  const langs = languages(agent.languages);
  return (
    <Layout nav="team" title={`${name}${team ? `, ${brand} ${teamShortName(team)}` : ''} | ${brand}`}
      description={`${name}, ${agent.title ?? 'agent immobilier'}${team ? ` à l'agence ${brand} ${teamShortName(team)} (${team.address.city})` : ''}. Téléphone, e-mail et annonces.`}>
      <div className="wrap top"><a className="back" href={R.team}><Icon name="back" size={18} />L'équipe</a></div>
      <section className="wrap who">
        {agent.photo && <RaImage className="who__photo" src={agent.photo} alt={agent.photo.alt || name} width={640} height={800} sizes="(min-width: 960px) 320px, 60vw" priority />}
        <div className="who__text">
          <h1 className="who__h1">{name}</h1>
          <p className="who__role">{[agent.title, team && `${brand} ${teamShortName(team)}`].filter(Boolean).join(' · ')}</p>
          {agent.bio && <p className="who__bio">{agent.bio}</p>}
          <dl className="who__facts">
            {agent.phone && <div><dt>Téléphone</dt><dd><a className="num" href={tel(agent.phone)}>{agent.phone}</a></dd></div>}
            {agent.email && <div><dt>E-mail</dt><dd><a href={`mailto:${agent.email}`}>{agent.email}</a></dd></div>}
            {langs && <div><dt>Langues</dt><dd>{langs}</dd></div>}
            {team && <div><dt>Agence</dt><dd><a href={teamHref(team)}>{teamShortName(team)}</a>, {[team.address.street, team.address.city].filter(Boolean).join(', ')}</dd></div>}
          </dl>
        </div>
      </section>

      {live.length > 0 && (
        <section className="wrap sec" aria-labelledby="l-h">
          <h2 id="l-h" className="h3">Les annonces de {agent.first_name}</h2>
          <ul className="cards">{live.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
        </section>
      )}
      {sold.length > 0 && (
        <section className="wrap sec" aria-labelledby="s-h">
          <h2 id="s-h" className="h3">Vendus par {agent.first_name}</h2>
          <ul className="cards">{sold.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
        </section>
      )}
      <section className="wrap sec form" aria-labelledby="f-h">
        <h2 id="f-h" className="h3">Écrire à {agent.first_name}</h2>
        <EnquiryForm agentId={agent.id} agentName={agent.first_name} contactReason="other" />
      </section>
    </Layout>
  );
}
