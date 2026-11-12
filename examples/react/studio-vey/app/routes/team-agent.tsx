import type { Route } from './+types/team-agent';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { SoldList } from '../components/SoldList';
import { ListingCard } from '../components/ListingCard';
import { JournalCard } from '../components/JournalCard';
import { brandName, site, sites } from '../lib/data.server';
import { posts, card } from '../content/journal.server';
import { agentSlug } from '../lib/urls';
import { fullName, languages, telHref } from '../lib/format';
import './team-agent.css';

export async function loader({ params }: Route.LoaderArgs) {
  const s = await site();
  const agent = s.agents.find((a) => agentSlug(a) === params.agent);
  if (!agent) throw notFound();
  const mine = (await sites.allListings()).filter((l) => l.agent?.id === agent.id);
  const name = fullName(agent);
  return {
    brand: brandName(s),
    agent,
    active: mine.filter((l) => l.status === 'available'),
    sold: mine.filter((l) => l.status === 'sold'),
    cities: [...new Set(mine.map((l) => l.address.city).filter(Boolean))] as string[],
    posts: posts().filter((p) => p.author === name).map(card),
  };
}

export default function AgentPage({ loaderData: { brand, agent, active, sold, cities, posts } }: Route.ComponentProps) {
  const name = fullName(agent);
  const photo = active.find((l) => l.photos[0])?.photos[0];
  const langs = languages(agent.languages);
  return (
    <Layout title={`${name} | ${brand}`} description={`${name}, ${brand}${cities.length ? `: Objekte in ${cities.join(', ')}` : ''}.`} image={photo && img(photo.url, { w: 1200, h: 630 })}>
      <section className="ah">
        <div className="wrap ah-in">
          <div className="ah-text">
            <p className="ah-back"><a href="/team">Team</a></p>
            <h1 className="h1">{name}</h1>
            {agent.title && <p className="caps muted">{agent.title}</p>}
            {agent.bio && <p className="lede">{agent.bio}</p>}
            <dl className="ah-facts">
              {langs && <div><dt>Sprachen</dt><dd>{langs}</dd></div>}
              {cities.length > 0 && <div><dt>Objekte in</dt><dd>{cities.join(', ')}</dd></div>}
              {agent.phone && <div><dt>Telefon</dt><dd><a href={telHref(agent.phone)}>{agent.phone}</a></dd></div>}
              {agent.email && <div><dt>E-Mail</dt><dd><a href={`mailto:${agent.email}`}>{agent.email}</a></dd></div>}
            </dl>
          </div>
          {agent.photo && (
            <div className="ah-photo"><RaImage src={agent.photo.url} alt={name} width={880} height={1100} priority sizes="(min-width: 1024px) 400px, (min-width: 640px) 320px, 100vw" mobile={{ width: 640, height: 800, sizes: '(min-width: 400px) 320px, 100vw' }} /></div>
          )}
        </div>
      </section>

      {active.length > 0 && (
        <section className="wrap section-tight flow" aria-labelledby="h-active">
          <header className="sec"><h2 className="h2" id="h-active">{active.length === 1 ? 'Ein Objekt' : `${active.length} Objekte`} von {agent.first_name}</h2></header>
          <ul className="grid">{active.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
        </section>
      )}
      {sold.length > 0 && (
        <section className="wrap section-tight flow" aria-labelledby="h-sold">
          <header className="sec"><h2 className="h2" id="h-sold">Zuletzt vermittelt</h2></header>
          <div className="sold-list"><SoldList listings={sold} /></div>
        </section>
      )}
      {posts.length > 0 && (
        <section className="wrap section-tight flow" aria-labelledby="h-posts">
          <header className="sec"><h2 className="h2" id="h-posts">Beiträge von {agent.first_name}</h2></header>
          <ul className="grid">{posts.map((p) => <li key={p.id}><JournalCard post={p} /></li>)}</ul>
        </section>
      )}

      <section className="enq section" aria-labelledby="h-contact">
        <div className="wrap enq-in">
          <div><h2 className="h2" id="h-contact">Schreiben Sie {agent.first_name}</h2></div>
          <EnquiryForm agentId={agent.id} agentName={agent.first_name} contactReason="other" />
        </div>
      </section>
    </Layout>
  );
}
