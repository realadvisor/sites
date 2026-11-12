import type { Route } from './+types/journal';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { JournalCard } from '../components/JournalCard';
import { brandName, site } from '../lib/data.server';
import { posts, card } from '../content/journal.server';
import './journal-index.css';

export async function loader() {
  return { brand: brandName(await site()), posts: posts().map(card) };
}

export default function Journal({ loaderData: { brand, posts } }: Route.ComponentProps) {
  const [lead, ...rest] = posts;
  return (
    <Layout title={`Journal | ${brand}`} description={`Notizen von ${brand} über Kaufen, Verkaufen und Mieten in Zürich, am See und in Zug.`} image={lead && img(lead.cover, { w: 1200, h: 630 })}>
      <PageHead title="Journal" lede="Beiträge aus dem Büro zu Besichtigungen, Verkäufen, Mietbewerbungen und zu den Gemeinden, in denen unsere Objekte liegen." />
      <section className="wrap jr" aria-label="Beiträge">
        {lead && <div className="jr-lead"><JournalCard post={lead} as="h2" large priority /></div>}
        {rest.length > 0 && <ul className="jr-grid">{rest.map((p) => <li key={p.id}><JournalCard post={p} as="h2" /></li>)}</ul>}
      </section>
    </Layout>
  );
}
