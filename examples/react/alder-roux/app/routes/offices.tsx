/** Offices: one card per office with its figures, then a branch map with every office. */
import type { Route } from './+types/offices';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { OfficeCard } from '../components/OfficeCard';
import { StaticMap } from '../components/StaticMap';
import { siteData, sites } from '../lib/data.server';
import { href, langOf, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import './offices.css';

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
  const located = teams.filter((x) => x.address.lat != null && x.address.lng != null);
  const mid = (k: 'lat' | 'lng') => {
    const v = located.map((x) => x.address[k]!);
    return (Math.min(...v) + Math.max(...v)) / 2;
  };
  // Zoom that keeps every office in view on a phone (about 300 px wide).
  const spread = located.length > 1 ? Math.max(...located.map((x) => x.address.lng!)) - Math.min(...located.map((x) => x.address.lng!)) : 0;
  const zoom = spread > 0 ? Math.max(5, Math.min(12, Math.floor(Math.log2((300 / 256) * (360 / spread))))) : 12;
  return (
    <Layout l={l} route="offices" title={`${t('officesPageTitle')} | ${name}`} description={t('officesLede')}>
      <section className="band on-navy">
        <div className="wrap band__inner">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navOffices') }]} />
          <h1 className="h1">{t('officesPageTitle')}</h1>
          <p className="lede">{t('officesLede')}</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <ul className="plain-list grid grid--3">
            {teams.map((x) => (
              <li key={x.id}><OfficeCard team={x} slug={teamSlug(x, teams)} l={l} as="h2" priority={teams[0] === x} agents={counts[x.id]!.agents} listings={counts[x.id]!.listings} /></li>
            ))}
          </ul>
        </div>
      </section>
      {located.length > 0 && (
        <div className="wrap mapwrap">
          <StaticMap lat={mid('lat')} lng={mid('lng')} zoom={zoom} height={440} label={t('officesPageTitle')} linkLabel={t('openMap')}
            points={located.map((x) => ({ lat: x.address.lat!, lng: x.address.lng!, label: cityName(x.address.city, l) || x.name, href: href('offices', l, teamSlug(x, teams)) }))} />
        </div>
      )}
    </Layout>
  );
}
