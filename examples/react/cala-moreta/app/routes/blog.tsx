import type { Route } from './+types/blog';
import { Site } from '../components/Site';
import { PostCard } from '../components/PostCard';
import { PHOTOS, photoOg } from '../lib/photos';
import { agency, brandName } from '../lib/data.server';
import { card, postsOf } from '../content/content.server';
import { UI, alternates, langOfPath } from '../lib/i18n';
import './blog.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  return { lang, name: brandName(await agency()), posts: postsOf(lang).map(card) };
}

export default function Blog({ loaderData: { lang, name, posts } }: Route.ComponentProps) {
  const ui = UI[lang];
  const [first, ...rest] = posts;
  const pair = rest.length % 3 === 1;
  return (
    <Site lang={lang} current="blog" title={`${ui.blogH1} | ${name}`} description={ui.blogLead}
      image={first && photoOg(PHOTOS[first.cover])} alternates={alternates('blog')}>
      <header className="phead wrap">
        <h1 className="display-xl">{ui.blogH1}</h1>
        <p className="lead">{ui.blogLead}</p>
      </header>
      <section className="wrap blog">
        {first && <div className="feature"><PostCard post={first} lang={lang} heading="h2" priority sizes="(min-width: 1360px) 720px, (min-width: 860px) 55vw, 100vw" /></div>}
        {rest.length > 0 && (
          <ul className={['grid3', pair && 'pair'].filter(Boolean).join(' ')}>
            {rest.map((p) => <li key={p.id}><PostCard post={p} lang={lang} heading="h2" sizes={pair ? '(min-width: 1360px) 620px, (min-width: 640px) 45vw, 100vw' : undefined} /></li>)}
          </ul>
        )}
      </section>
    </Site>
  );
}
