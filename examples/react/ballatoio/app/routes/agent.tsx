/** One agent: contacts, their homes (available, then sold), a form addressed to them. */
import type { Route } from './+types/agent';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { img } from '@realadvisor/sites-kit-core/image';
import { Site } from '../components/Site';
import { AgentBlock } from '../components/AgentBlock';
import { ListingCard } from '../components/ListingCard';
import { agency, cardOf, sites } from '../lib/data.server';
import { agentName, agentSlug, brandName, byNewest, firstPhoto } from '../lib/data';
import { LOCALE_OF, UI, alternates, fill, langOfPath } from '../lib/i18n';
import './agent.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, agents, all] = await Promise.all([agency(), sites.agents(), sites.allListings()]);
  const a = agents.find((x) => agentSlug(x) === params.slug);
  if (!a) throw notFound();
  const mine = all.filter((l) => l.agent?.id === a.id).sort(byNewest);
  const live = mine.filter((l) => l.status === 'available');
  return {
    lang,
    agent: a,
    brand: brandName(ag),
    live: live.map(cardOf),
    sold: mine.filter((l) => l.status === 'sold').map(cardOf),
    photo: a.photo ?? firstPhoto(live),
  };
}

export default function AgentPage({ loaderData: { lang, agent: a, brand, live, sold, photo } }: Route.ComponentProps) {
  const ui = UI[lang];
  const name = agentName(a);
  return (
    <Site lang={lang} current="team" title={`${name} | ${brand}`}
      description={[name, a.title, brand].filter(Boolean).join(', ')}
      image={photo && img(photo.url, { w: 1200, h: 630 })} alternates={alternates('team', agentSlug(a))}>
      <header className="wrap phead head">
        <AgentBlock agent={a} lang={lang} heading="h1" link={false} size="l" priority={!!a.photo} sizes="(min-width: 700px) 400px, 320px" />
      </header>

      <section className="wrap homes" aria-labelledby="homes-h">
        <h2 id="homes-h" className="d-l">{fill(ui.agentHomes, { name: a.first_name })}</h2>
        {live.length ? (
          <div className="grid">{live.map((l, i) => <ListingCard key={l.id} listing={l} lang={lang} priority={!a.photo && i === 0} />)}</div>
        ) : <p className="lead">{fill(ui.agentNone, { name: a.first_name })}</p>}
        {sold.length > 0 && (
          <>
            <h3 className="d-m sold-h">{ui.nav.sold}</h3>
            <div className="grid">{sold.map((l) => <ListingCard key={l.id} listing={l} lang={lang} showPrice={false} />)}</div>
          </>
        )}
      </section>

      <section className="form" aria-labelledby="form-h">
        <div className="wrap form-in">
          <h2 id="form-h" className="d-l">{fill(ui.writeTo, { name: a.first_name })}</h2>
          <EnquiryForm agentId={a.id} agentName={a.first_name} contactReason="other" locale={LOCALE_OF[lang]} />
        </div>
      </section>
    </Site>
  );
}
