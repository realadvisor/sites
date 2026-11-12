import type { Route } from './+types/post';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Site } from '../components/Site';
import { Photo } from '../components/Photo';
import { PostCard } from '../components/PostCard';
import { Markdown } from '../components/Markdown';
import { PHOTOS, photoOg } from '../lib/photos';
import { agency, sites } from '../lib/data.server';
import { agentSlug } from '../lib/data';
import { card, postSlugs, postsOf } from '../content/content.server';
import { UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import { formatDate } from '../lib/format';
import './post.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const posts = postsOf(lang);
  const post = posts.find((p) => p.path === params.slug);
  if (!post) throw notFound();
  const [ag, agents] = await Promise.all([agency(), sites.agents()]);
  const a = agents.find((x) => x.id === post.author);
  const author = a ? { name: `${a.first_name} ${a.last_name}`, slug: agentSlug(a) } : null;
  const name = ag.team?.name ?? ag.org.name;
  const image = photoOg(PHOTOS[post.cover]);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: new Date(post.date).toISOString(),
    image,
    author: author ? { '@type': 'Person', name: author.name } : undefined,
    publisher: { '@type': 'Organization', name: ag.org.name },
  };
  return { lang, name, post, author, slugs: postSlugs(post), more: posts.filter((p) => p.id !== post.id).slice(0, 3).map(card), jsonLd, image };
}

export default function PostPage({ loaderData: { lang, name, post: d, author, slugs, more, jsonLd, image } }: Route.ComponentProps) {
  const ui = UI[lang];
  return (
    <Site lang={lang} current="blog" title={`${d.title} | ${name}`} description={d.excerpt} image={image} alternates={alternates('blog', slugs)} jsonLd={jsonLd}>
      <article>
        <header className="wrap post-head">
          <nav className="crumbs" aria-label={ui.blogH1}><a href={href('blog', lang)}><span aria-hidden="true">←</span> {ui.blogH1}</a></nav>
          <h1 className="display-l">{d.title}</h1>
          <p className="post-lead">{d.excerpt}</p>
          <div className="byline">
            <p>
              {author && <a href={href('team', lang, author.slug)}>{fill(ui.by, { name: author.name })}</a>}
              <span>{d.tag} · <time dateTime={d.date}>{formatDate(d.date, lang)}</time> · {fill(ui.minutes, { n: Math.max(1, Math.round(d.words / 200)) })}</span>
            </p>
          </div>
        </header>
        <div className="wrap cover"><Photo photo={PHOTOS[d.cover]} lang={lang} priority landscapeAt sizes="(min-width: 1360px) 1232px, 100vw" /></div>
        <div className="wrap body"><div className="prose"><Markdown blocks={d.body} /></div></div>
      </article>
      {more.length > 0 && (
        <section className="section more">
          <div className="wrap">
            <div className="section-head"><div><h2 className="display-m">{ui.morePosts}</h2></div><a className="link" href={href('blog', lang)}>{ui.journalAll} <span className="arrow" aria-hidden="true">→</span></a></div>
            <ul className="grid3">{more.map((p) => <li key={p.id}><PostCard post={p} lang={lang} /></li>)}</ul>
          </div>
        </section>
      )}
    </Site>
  );
}
