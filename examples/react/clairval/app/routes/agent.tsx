/** Agent page: portrait, office, languages and contacts; their listings; a form addressed to them. */
import type { Route } from './+types/agent';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Site } from '../components/Site';
import { Crumbs } from '../components/Crumbs';
import { Img } from '../components/Img';
import { ListingCard } from '../components/ListingCard';
import { cardOf, findAgent, siteData, sites } from '../lib/data.server';
import { agentSlug, href, langOfPath, LOCALE, teamSlug } from '../lib/routes';
import { cityName, languages, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './agent.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const a = await findAgent(params.slug);
  if (!a) throw notFound();
  const [{ org, teams, agents }, all] = await Promise.all([siteData(), sites.allListings()]);
  const mine = all.filter((x) => x.agent?.id === a.id).map(cardOf);
  const team = teams.find((x) => a.team_ids.includes(x.id));
  return {
    l,
    a,
    slug: agentSlug(a, agents),
    orgName: org.name,
    available: mine.filter((x) => x.status === 'available'),
    sold: mine.filter((x) => x.status === 'sold'),
    team: team && { slug: teamSlug(team, teams), name: team.name, city: team.address.city, street: team.address.street },
  };
}

export default function AgentPage({ loaderData: { l, a, slug, orgName, available, sold, team } }: Route.ComponentProps) {
  const t = tx(l);
  const name = `${a.first_name} ${a.last_name}`;
  const city = team ? cityName(team.city, l) || team.name : '';
  const C = {
    en: { role: a.title ?? (city ? `${city} office` : ''), langs: 'Languages', props: (n: number) => `${n} ${n === 1 ? 'property' : 'properties'} with ${a.first_name}`, sold: 'Sold', write: `Write to ${a.first_name}`, office: 'Office' },
    fr: { role: a.title ?? (city ? `Bureau de ${city}` : ''), langs: 'Langues', props: (n: number) => `${n} ${n === 1 ? 'bien' : 'biens'} avec ${a.first_name}`, sold: 'Vendus', write: `Écrire à ${a.first_name}`, office: 'Bureau' },
  }[l];
  const langs = languages(a.languages, l);
  return (
    <Site l={l} route="team" segs={[slug]} title={`${name}${C.role ? `, ${C.role}` : ''} | ${orgName}`} description={`${name}, ${orgName}. ${C.props(available.length)}.`}>
      <div className="wrap top">
        <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navTeam'), href: href('team', l) }, { label: name }]} />
      </div>
      <section className="wrap hero">
        {a.photo && (
          <div className="hero__photo">
            <Img src={a.photo} alt={a.photo.alt || name} width={720} height={900} priority sizes="(min-width: 1024px) 420px, 100vw" widths={[480, 720, 960]} />
          </div>
        )}
        <div className="hero__text">
          <h1 className="h1 hero__name">{name}</h1>
          {C.role && <p className="lede">{C.role}</p>}
          <dl className="facts">
            {langs && <div><dt>{C.langs}</dt><dd>{langs}</dd></div>}
            {a.phone && <div><dt>{t('phone')}</dt><dd><a className="num" href={tel(a.phone)}>{a.phone}</a></dd></div>}
            {a.email && <div><dt>{t('email')}</dt><dd><a href={`mailto:${a.email}`}>{a.email}</a></dd></div>}
            {team && <div><dt>{C.office}</dt><dd><a href={href('offices', l, team.slug)}>{[team.street, team.city].filter(Boolean).join(', ')}</a></dd></div>}
          </dl>
          {a.bio && <p className="bio">{a.bio}</p>}
        </div>
      </section>
      {available.length > 0 && (
        <section className="wrap block">
          <h2 className="h2 block__h">{C.props(available.length)}</h2>
          <ul className="plain grid3">{available.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
        </section>
      )}
      {sold.length > 0 && (
        <section className="wrap block">
          <h2 className="h3 block__h">{C.sold}</h2>
          <ul className="plain grid3">{sold.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
        </section>
      )}
      <section className="on-paper form">
        <div className="wrap form__in">
          <h2 className="h2">{C.write}</h2>
          <EnquiryForm agentId={a.id} agentName={a.first_name} contactReason="other" locale={LOCALE[l]} />
        </div>
      </section>
    </Site>
  );
}
