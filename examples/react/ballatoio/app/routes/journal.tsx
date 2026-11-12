/** Journal: the newest post large, the others as a plain list. */
import type { Route } from './+types/journal';
import { img } from '@realadvisor/sites-kit/image';
import { Site } from '../components/Site';
import { Photo } from '../components/Photo';
import { agency, sites } from '../lib/data.server';
import { agentName, brandName } from '../lib/data';
import { card, postsOf } from '../content/content.server';
import { placePhoto } from '../lib/places';
import { UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import { formatDate } from '../lib/format';
import './journal.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const ui = UI[lang];
  const [ag, agents] = await Promise.all([agency(), sites.agents()]);
  const author = (id?: string) => {
    const a = agents.find((x) => x.id === id);
    return a ? fill(ui.by, { name: agentName(a) }) : '';
  };
  const posts = postsOf(lang).map((p) => ({ ...card(p), byline: author(p.author) }));
  const first = posts[0];
  return { lang, brand: brandName(ag), posts, cover: first && placePhoto(first.cover, lang, first.coverIndex) };
}

export default function Journal({ loaderData: { lang, brand, posts, cover } }: Route.ComponentProps) {
  const ui = UI[lang];
  const [first, ...rest] = posts;
  return (
    <Site lang={lang} current="journal" title={`${ui.journalH1} | ${brand}`} description={ui.journalLead}
      image={cover && img(cover.url, { w: 1200, h: 630 })} alternates={alternates('journal')}>
      <header className="wrap phead">
        <h1 className="d-xl">{ui.journalH1}</h1>
        <p className="lead">{ui.journalLead}</p>
      </header>
      {first && (
        <article className="wrap first">
          {cover && <div className="frame first-photo"><Photo src={cover} alt={cover.alt} width={1200} height={800} priority sizes="(min-width: 900px) 58vw, 100vw" /></div>}
          <div className="first-text">
            <p className="small muted"><time dateTime={first.date}>{formatDate(new Date(first.date), lang)}</time> · {fill(ui.minutes, { n: first.minutes })}</p>
            <h2 className="d-l"><a href={href('journal', lang, first.path)}>{first.title}</a></h2>
            <p className="lead">{first.excerpt}</p>
            {first.byline && <p className="small">{first.byline}</p>}
          </div>
        </article>
      )}
      {rest.length > 0 && (
        <ol className="wrap list">
          {rest.map((p) => (
            <li key={p.id}>
              <p className="small muted"><time dateTime={p.date}>{formatDate(new Date(p.date), lang)}</time></p>
              <h2 className="d-m"><a href={href('journal', lang, p.path)}>{p.title}</a></h2>
              <p>{p.excerpt}</p>
              <p className="small muted">{[p.byline, fill(ui.minutes, { n: p.minutes })].filter(Boolean).join(' · ')}</p>
            </li>
          ))}
        </ol>
      )}
    </Site>
  );
}
