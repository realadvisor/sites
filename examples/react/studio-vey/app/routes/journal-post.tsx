import { Fragment } from 'react';
import type { Route } from './+types/journal-post';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { canonical } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { JournalCard } from '../components/JournalCard';
import { AgentCard } from '../components/AgentCard';
import { areas, brandName, site } from '../lib/data.server';
import { post as getPost, posts, card } from '../content/journal.server';
import { areaUrl } from '../lib/urls';
import { formatDate, fullName } from '../lib/format';
import './journal-slug.css';

export async function loader({ params, request }: Route.LoaderArgs) {
  const post = getPost(params.slug);
  if (!post) throw notFound();
  const [s, places] = await Promise.all([site(), areas()]);
  const author = s.agents.find((a) => fullName(a) === post.author) ?? null;
  const linked = post.cities.map((c) => places.find((p) => p.city === c)).filter((p) => !!p);
  const more = posts().filter((p) => p.id !== post.id).slice(0, 3).map(card);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: new Date(post.date).toISOString(),
    image: img(post.cover, { w: 1200, h: 630 }),
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: s.org.name },
    mainEntityOfPage: canonical(new URL(new URL(request.url).pathname, request.url)),
  };
  return { brand: brandName(s), post, author, linked, more, jsonLd };
}

export default function JournalPost({ loaderData: { brand, post: d, author, linked, more, jsonLd } }: Route.ComponentProps) {
  return (
    <Layout title={`${d.title} | ${brand}`} description={d.excerpt} image={img(d.cover, { w: 1200, h: 630 })} jsonLd={jsonLd}>
      <article>
        <header className="ah wrap">
          <p className="caps muted"><a href="/journal">Journal</a> · {d.topic} · <time dateTime={d.date}>{formatDate(d.date)}</time></p>
          <h1 className="h1">{d.title}</h1>
          <p className="lede">{d.excerpt}</p>
        </header>
        <div className="wrap"><div className="ah-media"><RaImage src={d.cover} alt={d.coverAlt} width={1600} height={900} priority sizes="(min-width: 1360px) 1248px, 100vw" mobile={{ width: 800, height: 600 }} /></div></div>
        <div className="wrap body">
          <aside className="body-side">
            {author ? <AgentCard agent={author} layout="row" as="p" /> : <p>{d.author}</p>}
            {linked.length > 0 && <p className="body-places caps muted">Orte: {linked.map((p, i) => <Fragment key={p.slug}>{i > 0 && ', '}<a href={areaUrl(p.city)}>{p.city}</a></Fragment>)}</p>}
          </aside>
          <div className="prose body-text">
            {d.body.map((b, i) =>
              b.type === 'h2' ? <h2 key={i} id={b.id}>{b.text}</h2> : b.type === 'ul' ? <ul key={i}>{b.items.map((x, j) => <li key={j}>{x}</li>)}</ul> : <p key={i}>{b.text}</p>,
            )}
          </div>
        </div>
      </article>
      {more.length > 0 && (
        <section className="more-posts section" aria-labelledby="h-more">
          <div className="wrap">
            <header className="sec"><h2 className="h2" id="h-more">Weiterlesen</h2></header>
            <ul className="grid">{more.map((p) => <li key={p.id}><JournalCard post={p} /></li>)}</ul>
          </div>
        </section>
      )}
    </Layout>
  );
}
