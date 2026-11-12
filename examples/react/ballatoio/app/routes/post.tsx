/** One journal post: title, byline, cover, text, other posts. */
import type { Route } from './+types/post';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit/image';
import { Site } from '../components/Site';
import { Photo } from '../components/Photo';
import { Prose } from '../components/Prose';
import { agency, sites } from '../lib/data.server';
import { agentName, agentSlug, brandName } from '../lib/data';
import { card, postSlugs, postsOf } from '../content/content.server';
import { placePhoto } from '../lib/places';
import { UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import { formatDate } from '../lib/format';
import './post.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { pathname } = new URL(request.url);
  const lang = langOfPath(pathname);
  const posts = postsOf(lang);
  const post = posts.find((p) => p.path === params.slug);
  if (!post) throw notFound();
  const [ag, agents] = await Promise.all([agency(), sites.agents()]);
  const a = agents.find((x) => x.id === post.author);
  const brand = brandName(ag);
  return {
    lang,
    brand,
    post,
    author: a && { name: agentName(a), slug: agentSlug(a) },
    slugs: postSlugs(post),
    cover: placePhoto(post.cover, lang, post.coverIndex),
    others: posts.filter((p) => p.id !== post.id).slice(0, 3).map(card),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      datePublished: post.date,
      inLanguage: lang,
      url: new URL(pathname, siteUrl()).href,
      ...(a ? { author: { '@type': 'Person', name: agentName(a) } } : {}),
      publisher: { '@type': 'RealEstateAgent', name: brand },
    },
  };
}

export default function PostPage({ loaderData: { lang, brand, post, author, slugs, cover, others, jsonLd } }: Route.ComponentProps) {
  const ui = UI[lang];
  return (
    <Site lang={lang} current="journal" title={`${post.title} | ${brand}`} description={post.excerpt}
      image={cover && img(cover.url, { w: 1200, h: 630 })} alternates={alternates('journal', slugs)} jsonLd={jsonLd}>
      <article>
        <header className="wrap phead head">
          <p className="small"><a className="back" href={href('journal', lang)}><span aria-hidden="true">←</span> {ui.journalH1}</a></p>
          <h1 className="d-xl">{post.title}</h1>
          <p className="lead">{post.excerpt}</p>
          <p className="small muted">
            <time dateTime={post.date}>{formatDate(new Date(post.date), lang)}</time>
            {author && <> · <a href={href('team', lang, author.slug)}>{fill(ui.by, { name: author.name })}</a></>}
            {' · '}{fill(ui.minutes, { n: post.minutes })}
          </p>
        </header>
        {cover && <div className="wrap"><div className="frame cover"><Photo src={cover} alt={cover.alt} width={1600} height={800} priority widths={[640, 960, 1280, 1600, 1920]} sizes="(min-width: 1520px) 1424px, 100vw" mobile={{ width: 800, height: 600 }} /></div></div>}
        <div className="wrap body"><Prose blocks={post.body} /></div>
      </article>
      {others.length > 0 && (
        <nav className="wrap others" aria-labelledby="others-h">
          <h2 id="others-h" className="d-l">{ui.morePosts}</h2>
          <ul>
            {others.map((p) => (
              <li key={p.id}><a href={href('journal', lang, p.path)}><span className="d-s">{p.title}</span><span className="small muted">{formatDate(new Date(p.date), lang)}</span></a></li>
            ))}
          </ul>
        </nav>
      )}
    </Site>
  );
}
