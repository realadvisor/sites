import type { Route } from './+types/team';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { AgentCard } from '../components/AgentCard';
import { TalkBand } from '../components/TalkBand';
import { brandName, site, sites } from '../lib/data.server';
import { languages } from '../lib/format';
import './team-index.css';

export async function loader() {
  const [s, listings] = await Promise.all([site(), sites.allListings({ status: 'available' })]);
  const counts = Object.fromEntries(s.agents.map((a) => [a.id, listings.filter((l) => l.agent?.id === a.id).length]));
  return { s, brand: brandName(s), counts };
}

export default function Team({ loaderData: { s, brand, counts } }: Route.ComponentProps) {
  const langs = languages([...new Set(s.agents.flatMap((a) => a.languages ?? []))]);
  return (
    <Layout title={`Team | ${brand}`} description={`Das Team von ${brand} in ${s.team.address.city ?? 'Zürich'}: ${s.agents.map((a) => `${a.first_name} ${a.last_name}`).join(', ')}.`}>
      <PageHead title="Team" lede={langs ? `Wir beraten Sie auf ${langs}.` : undefined} />
      <section className="wrap team" aria-label="Unser Team">
        <ul className="team-grid">{s.agents.map((a) => <li key={a.id}><AgentCard agent={a} count={counts[a.id]} as="h2" /></li>)}</ul>
      </section>
      <TalkBand text="Schreiben Sie uns, wir leiten Ihre Anfrage an die richtige Person weiter." phone={s.team.phone} email={s.team.email} action={{ href: '/kontakt', label: 'Zum Kontaktformular' }} />
    </Layout>
  );
}
