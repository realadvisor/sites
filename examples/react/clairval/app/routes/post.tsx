/** One journal article: cover, title, date and author (an agent of the site, when one matches), body, the destination link. */
import { Fragment } from 'react';
import type { Route } from './+types/post';
import { img } from '@realadvisor/sites-kit/image';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Site } from '../components/Site';
import { Crumbs } from '../components/Crumbs';
import { Img } from '../components/Img';
import { AgentCard } from '../components/AgentCard';
import { agentOf, siteData } from '../lib/data.server';
import { href, langOfPath } from '../lib/routes';
import { tx } from '../lib/copy';
import { dateLong } from '../lib/format';
import { findPost, POSTS } from '../content/journal';
import './post.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const p = findPost(params.slug);
  if (!p) throw notFound();
  const { org, teams, agents } = await siteData();
  const author = p.author ? agents.find((a) => a.email === p.author) : undefined;
  return {
    l,
    slug: p.slug,
    orgName: org.name,
    author: author && agentOf(author),
    agents: agents.map(({ id, first_name, last_name }) => ({ id, first_name, last_name })),
    teams: teams.map(({ id, name, address }) => ({ id, name, address })),
  };
}

export default function Post({ loaderData: { l, slug, orgName, author, agents, teams } }: Route.ComponentProps) {
  const t = tx(l);
  const p = findPost(slug)!;
  const others = POSTS.filter((x) => x.slug !== p.slug);
  const C = {
    en: { by: 'Written by', more: 'More from the journal', dest: 'Properties in this area' },
    fr: { by: 'Rédigé par', more: 'Autres articles', dest: 'Les biens de ce secteur' },
  }[l];
  return (
    <Site l={l} route="journal" segs={[p.slug]} title={`${p.title[l]} | ${orgName}`} description={p.summary[l]} image={img(p.cover.url, { w: 1200, h: 630 })}>
      <article>
        <header className="wrap narrow head">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navJournal'), href: href('journal', l) }]} />
          <h1 className="h1 head__title">{p.title[l]}</h1>
          <p className="lede">{p.summary[l]}</p>
          <p className="muted"><time dateTime={p.date}>{dateLong(p.date, l)}</time>{author && <> · {author.first_name} {author.last_name}</>}</p>
        </header>
        <div className="wrap cover">
          <Img src={p.cover.url} alt={p.cover.alt[l]} width={1600} height={800} priority sizes="(min-width: 1440px) 1320px, 100vw" mobile={{ width: 800, height: 600 }} />
        </div>
        <div className="wrap narrow body">
          <div className="prose">
            {p.body[l].map((b, i) => (
              <Fragment key={i}>
                {b.h && <h2>{b.h}</h2>}
                {b.p && <p>{b.p}</p>}
                {b.list && <ul>{b.list.map((x) => <li key={x}>{x}</li>)}</ul>}
              </Fragment>
            ))}
          </div>
          <p className="dest"><a className="link" href={href('destinations', l, p.place)}>{C.dest}</a></p>
          {author && (
            <aside className="author">
              <h2 className="label muted">{C.by}</h2>
              <AgentCard agent={author} all={agents} teams={teams} l={l} compact />
            </aside>
          )}
        </div>
      </article>
      {others.length > 0 && (
        <section className="on-paper more">
          <div className="wrap narrow">
            <h2 className="h3">{C.more}</h2>
            <ul className="plain">
              {others.map((x) => <li key={x.slug}><a href={href('journal', l, x.slug)}><span>{x.title[l]}</span><time className="muted small" dateTime={x.date}>{dateLong(x.date, l)}</time></a></li>)}
            </ul>
          </div>
        </section>
      )}
    </Site>
  );
}
