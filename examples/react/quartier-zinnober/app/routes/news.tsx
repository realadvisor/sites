// Baustelle (News): the construction timeline from app/content/news, with
// the development's construction photos (fixture only) and the planned move-in dates.
import type { CSSProperties } from 'react';
import type { Route } from './+types/news';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { Photo } from '../components/Photo';
import { BucketPicture } from '../components/BucketPicture';
import { Icon } from '../components/Icon';
import { site as load } from '../lib/data.server';
import { news } from '../content/news.server';
import { newsDate, newsMonth } from '../lib/dates';
import './news.css';

export async function loader() {
  const { dev } = await load();
  const entries = news(dev.id);
  const now = Date.now();
  // Even spacing (the dates cluster); today sits between the last past and the first future entry.
  const pos = (i: number) => (entries.length > 1 ? (i / (entries.length - 1)) * 100 : 0);
  const past = entries.filter((e) => new Date(e.date).getTime() <= now).length;
  const today = past <= 0 ? 0 : past >= entries.length ? 100 : pos(past - 0.5);
  const lead = entries.filter((e) => !e.planned).at(-1);
  const ogPhoto = lead?.photoUrl ?? dev.photos[0]?.url;
  return {
    meta: {
      title: `Baustelle: Etappen und Neuigkeiten | ${dev.title}`,
      description: `Vom Spatenstich bis zum Bezug: die Etappen des ${dev.title}${lead ? `, zuletzt «${lead.title}» (${newsMonth(lead.date)})` : ''}.`,
      image: ogPhoto && img(ogPhoto, { w: 1200, h: 630 }),
    },
    entries: entries.map((e, i) => ({ ...e, left: pos(i) })),
    today,
    todayLabel: new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' }).format(new Date(now)),
  };
}

export default function News({ loaderData: { meta, entries, today, todayLabel } }: Route.ComponentProps) {
  const newestFirst = [...entries].reverse();
  return (
    <Layout page="news" {...meta}>
      <PageHead title="Baustelle" lead="Vom Spatenstich bis zum Bezug des letzten Hauses: hier halten wir fest, was auf der Baustelle passiert." tone="ink" />

      {entries.length > 0 && (
        <section className="line-band" aria-label="Zeitstrahl">
          <div className="wrap">
            <div className="line" style={{ '--today': `${today}%` } as CSSProperties}>
              <div className="track" aria-hidden="true"><span className="fill"></span></div>
              <span className="today" aria-hidden="true"><span>Heute · {todayLabel}</span></span>
              <ol className="marks">
                {entries.map((e) => (
                  <li key={e.id} className={e.planned ? 'planned' : undefined} style={{ left: `${e.left}%` }}>
                    <a href={`#${e.id}`}>
                      <span className="dot" aria-hidden="true"></span>
                      <span className="lbl"><strong>{e.phase}</strong><span>{newsMonth(e.date)}</span></span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      <section className="wrap feed" aria-label="Neuigkeiten">
        <ol className="items">
          {newestFirst.map((e) => (
            <li className={['item', e.planned && 'planned'].filter(Boolean).join(' ')} id={e.id} key={e.id}>
              <div className="when">
                <time dateTime={e.date}>{e.planned ? newsMonth(e.date) : newsDate(e.date)}</time>
                <span className={['state', e.planned && 'state--planned'].filter(Boolean).join(' ')}>{e.planned ? 'Geplant' : 'Erledigt'}</span>
              </div>
              <article className="body">
                <div className="txt">
                  <p className="houses">{e.houses.map((h) => <span key={h} className={`h h--${h.toLowerCase()}`}>Haus {h}</span>)}</p>
                  <h2>{e.title}</h2>
                  <div className="prose">{e.body.map((p, i) => <p key={i}>{p}</p>)}</div>
                </div>
                {(e.photoUrl || e.photoLocal) && (
                  <figure className="pic">
                    {e.photoLocal ? (
                      <BucketPicture name={e.photoLocal} alt={e.photoAlt ?? e.title} ratio={3 / 2} sizes="(min-width: 1000px) 40vw, 100vw" />
                    ) : (
                      <Photo src={e.photoUrl!} alt={e.photoAlt ?? e.title} width={900} height={600} sizes="(min-width: 1000px) 40vw, 100vw" />
                    )}
                  </figure>
                )}
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="band band--butter">
        <div className="wrap end">
          <h2>Freie Wohnungen nach Haus und Bezugstermin</h2>
          <a className="cta" href="/wohnungen">Zu den Wohnungen <Icon name="arrow" /></a>
        </div>
      </section>
    </Layout>
  );
}
