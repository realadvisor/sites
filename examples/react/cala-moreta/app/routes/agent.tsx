import type { Route } from './+types/agent';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Site } from '../components/Site';
import { AgentPortrait } from '../components/AgentPortrait';
import { ListingCard } from '../components/ListingCard';
import { agency, brandName, sites } from '../lib/data.server';
import { agentSlug } from '../lib/data';
import { LOCALE_OF, UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import { languageList, telHref } from '../lib/format';
import './agent.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const a = (await sites.agents()).find((x) => agentSlug(x) === params.slug);
  if (!a) throw notFound();
  const [ag, all] = await Promise.all([agency(), sites.allListings({ status: 'available' })]);
  return { lang, a, agencyName: brandName(ag), mine: all.filter((l) => l.agent?.id === a.id) };
}

export default function AgentPage({ loaderData: { lang, a, agencyName, mine } }: Route.ComponentProps) {
  const ui = UI[lang];
  const name = `${a.first_name} ${a.last_name}`;
  return (
    <Site lang={lang} current="team" title={`${name} | ${agencyName}`}
      description={`${name}, ${agencyName}. ${a.languages?.length ? `${ui.speaks} ${languageList(a.languages, lang)}.` : ''}`}
      alternates={alternates('team', agentSlug(a))}>
      <div className="wrap">
        <nav className="crumbs" aria-label={ui.nav.team}><a href={href('team', lang)}><span aria-hidden="true">←</span> {fill(ui.backTo, { page: ui.nav.team })}</a></nav>
        <header className={['ahead', a.photo?.url && 'has-photo'].filter(Boolean).join(' ')}>
          <AgentPortrait agent={a} sizes="(min-width: 861px) 360px, 80vw" priority className="ahead-photo" />
          <div className="ahead-text">
            <h1 className="display-l">{name}</h1>
            <p className="ahead-role">{a.title ? `${a.title}, ${agencyName}` : agencyName}</p>
            {a.languages?.length ? <p className="ahead-role">{ui.speaks} {languageList(a.languages, lang)}</p> : null}
            <p className="ahead-contact">
              {a.phone && <a className="cta cta-line num" href={telHref(a.phone)}>{a.phone}</a>}
              {a.email && <a className="cta cta-line" href={`mailto:${a.email}`}>{a.email}</a>}
            </p>
          </div>
        </header>
        {a.bio && <div className="prose bio"><p>{a.bio}</p></div>}
      </div>

      <section className="section wrap">
        <div className="section-head"><div><h2 className="display-m">{fill(ui.agentListings, { name: a.first_name })}</h2></div></div>
        {mine.length > 0
          ? <ul className="grid3">{mine.map((l, i) => <li key={l.id}><ListingCard listing={l} lang={lang} priority={i === 0} /></li>)}</ul>
          : <p className="lead">{fill(ui.agentNoListings, { name: a.first_name })}</p>}
      </section>

      <section className="ask">
        <div className="wrap ask-in">
          <div><h2 className="display-m">{fill(ui.contactAgent, { name: a.first_name })}</h2></div>
          <EnquiryForm agentId={a.id} agentName={a.first_name} contactReason="other" locale={LOCALE_OF[lang]} />
        </div>
      </section>
    </Site>
  );
}
