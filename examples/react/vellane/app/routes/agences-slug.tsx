/** One agency: address and contact, its own text, its agents (portraits when set) and its listings. */
import type { Route } from './+types/agences-slug';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { img } from '@realadvisor/sites-kit/image';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { RaImage } from '../components/RaImage';
import { Layout } from '../components/Layout';
import { ListingCard } from '../components/ListingCard';
import { AgentBlock } from '../components/AgentBlock';
import { Icon } from '../components/Icon';
import { siteData, sites } from '../lib/data.server';
import { R, teamShortName, teamSlug, tel } from '../lib/site';
import { placeFor } from '../content/places';
import './agences-slug.css';

export async function loader({ params }: Route.LoaderArgs) {
  const { org, teams, agents } = await siteData();
  const team = teams.find((t) => teamSlug(t) === params.slug);
  if (!team) throw notFound();
  const [listings, sold] = await Promise.all([
    sites.allListings({ team_id: team.id, status: 'available' }),
    sites.allListings({ team_id: team.id, status: 'sold' }),
  ]);
  const a = team.address;
  return {
    brand: org.name.replace(/\s+SAS$/, ''),
    team,
    people: agents.filter((x) => x.team_ids.includes(team.id)),
    listings,
    sold,
    jsonLd: agencyJsonLd({ id: team.id, name: team.name, phone: team.phone, email: team.email, address: a }, new URL(siteUrl()).origin),
  };
}

export default function Page({ loaderData: { brand, team, people, listings, sold, jsonLd } }: Route.ComponentProps) {
  const name = teamShortName(team);
  const photo = placeFor(teamSlug(team))[0];
  const a = team.address;
  const mapsHref = a.lat != null && a.lng != null ? `https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=17/${a.lat}/${a.lng}` : undefined;
  const buy = listings.filter((l) => l.offer_type === 'buy');
  const rent = listings.filter((l) => l.offer_type === 'rent');
  return (
    <Layout nav="agencies" title={`Agence ${brand} ${name}, ${a.city ?? ''} | ${brand}`}
      description={`${team.description_text ?? `Agence ${brand} ${name}.`} ${[a.street, [a.postcode, a.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}.`}
      image={photo && img(photo.url, { w: 1200, h: 630 })} jsonLd={jsonLd}>
      <div className="wrap top">
        <a className="back" href={R.agencies}><Icon name="back" size={18} />Toutes les agences</a>
      </div>
      <section className="wrap office">
        <div className="office__text">
          <h1 className="office__h1">{brand} {name}</h1>
          {team.description && <div className="prose office__desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(team.description) }} />}
          <dl className="office__facts">
            <div>
              <dt>Adresse</dt>
              <dd>
                {a.street && <>{a.street}<br /></>}{[a.postcode, a.city].filter(Boolean).join(' ')}
                {mapsHref && <><br /><a className="link" href={mapsHref} rel="noopener" target="_blank">Voir sur la carte<span className="visually-hidden"> (nouvel onglet)</span></a></>}
              </dd>
            </div>
            {team.phone && <div><dt>Téléphone</dt><dd><a className="num" href={tel(team.phone)}>{team.phone}</a></dd></div>}
            {team.email && <div><dt>E-mail</dt><dd><a href={`mailto:${team.email}`}>{team.email}</a></dd></div>}
            {listings.length > 0 && <div><dt>Annonces</dt><dd>{buy.length > 0 && `${buy.length} à vendre`}{buy.length > 0 && rent.length > 0 && ', '}{rent.length > 0 && `${rent.length} à louer`}</dd></div>}
          </dl>
        </div>
        {photo && <RaImage className="office__img" src={photo} alt={photo.alt ?? ''} width={1000} height={1100} sizes="(min-width: 960px) 560px, 100vw" priority mobile={{ width: 800, height: 600 }} />}
      </section>

      {people.length > 0 && (
        <section className="wrap sec" aria-labelledby="team-h">
          <h2 id="team-h" className="h3">L'équipe</h2>
          <ul className="people">{people.map((p) => <li key={p.id}><AgentBlock agent={p} /></li>)}</ul>
        </section>
      )}

      {listings.length > 0 && (
        <section className="wrap sec" aria-labelledby="ls-h">
          <h2 id="ls-h" className="h3">Les annonces de l'agence</h2>
          <ul className="cards">{listings.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
        </section>
      )}

      {sold.length > 0 && (
        <section className="wrap sec" aria-labelledby="sold-h">
          <h2 id="sold-h" className="h3">Vendus par l'agence</h2>
          <ul className="cards">{sold.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
        </section>
      )}

      <section className="wrap sec contact" aria-labelledby="c-h">
        <h2 id="c-h" className="h3">Écrire à l'agence {name}</h2>
        <EnquiryForm contactReason="other" message={`Bonjour, je souhaite être contacté(e) par l'agence ${name}.`} />
      </section>
    </Layout>
  );
}
