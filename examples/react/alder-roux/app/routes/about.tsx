/** About: the agency's story (site content) beside a photo, then the offices. */
import type { Route } from './+types/about';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { OfficeCard } from '../components/OfficeCard';
import { PlacePhoto } from '../components/PlacePhoto';
import { siteData, sites } from '../lib/data.server';
import { href, langOf, teamSlug } from '../lib/routes';
import { cityName, joinList, tx } from '../lib/copy';
import { ABOUT } from '../content/pages';
import { ABOUT_PHOTO, placeAlt } from '../content/places';
import './about.css';

export async function loader({ request }: Route.LoaderArgs) {
  const [{ org, teams, agents }, available] = await Promise.all([siteData(), sites.allListings({ status: 'available' })]);
  return {
    l: langOf(new URL(request.url).pathname),
    name: org.name,
    teams,
    counts: Object.fromEntries(teams.map((x) => [x.id, { agents: agents.filter((a) => a.team_ids.includes(x.id)).length, listings: available.filter((y) => y.team_ids.includes(x.id)).length }])),
  };
}

export default function Page({ loaderData: { l, name, teams, counts } }: Route.ComponentProps) {
  const t = tx(l);
  const cities = joinList(teams.map((x) => cityName(x.address.city, l)).filter(Boolean), l);
  const a = ABOUT[l];
  const photo = ABOUT_PHOTO;
  return (
    <Layout l={l} route="about" title={`${t('navAbout')} | ${name}`} description={t('aboutLede', { name, cities })}>
      <section className="band on-navy">
        <div className="wrap band__inner">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navAbout') }]} />
          <h1 className="h1">{a.title}</h1>
          <p className="lede">{t('aboutLede', { name, cities })}</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap story">
          <div className="story__txt">
            {a.paragraphs.map((p, i) => <p key={i} className={i === 0 ? 'first' : undefined}>{p}</p>)}
          </div>
          <PlacePhoto place={photo} alt={placeAlt(photo, l)} width={900} height={1100} sizes="(min-width: 900px) 40vw, 100vw" priority />
        </div>
      </section>

      <section className="section section--paper">
        <div className="wrap">
          <div className="head"><h2 className="h2">{t('officesTitleN', { cities })}</h2></div>
          <ul className="plain-list grid grid--3">
            {teams.map((x) => <li key={x.id}><OfficeCard team={x} slug={teamSlug(x, teams)} l={l} agents={counts[x.id]!.agents} listings={counts[x.id]!.listings} /></li>)}
          </ul>
        </div>
      </section>
    </Layout>
  );
}
