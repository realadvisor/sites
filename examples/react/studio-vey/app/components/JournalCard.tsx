/** Journal post card: photo, topic, title, date. */
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import type { PostCard } from '../content/journal.server';
import { formatDate } from '../lib/format';
import './JournalCard.css';

type Props = { post: PostCard; as?: 'h2' | 'h3'; large?: boolean; priority?: boolean };

export function JournalCard({ post: d, as: H = 'h3', large = false, priority = false }: Props) {
  return (
    <article className={large ? 'jc jc--large' : 'jc'}>
      <a href={`/journal/${d.id}`} className="jc-link">
        <div className="jc-media">
          <RaImage src={d.cover} alt={d.coverAlt} priority={priority} width={large ? 1200 : 800} height={large ? 800 : 560} sizes={large ? '(min-width: 1024px) 58vw, 100vw' : '(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw'} />
        </div>
        <p className="jc-kicker caps muted" title={`${d.topic} · ${formatDate(d.date)}`}>{d.topic} · <time dateTime={d.date}>{formatDate(d.date)}</time></p>
        <H className="jc-title">{d.title}</H>
        {large && <p className="jc-excerpt">{d.excerpt}</p>}
      </a>
    </article>
  );
}
