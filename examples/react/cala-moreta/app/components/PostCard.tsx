import { Photo } from './Photo';
import { PHOTOS } from '../lib/photos';
import { UI, href, type Lang } from '../lib/i18n';
import { formatDate } from '../lib/format';
import type { PostCard as Post } from '../content/content.server';
import './PostCard.css';

type Props = { post: Post; lang: Lang; heading?: 'h2' | 'h3'; priority?: boolean; /** Layout width of the card photo. */ sizes?: string };

export function PostCard({ post: d, lang, heading: H = 'h3', priority = false, sizes = '(min-width: 1360px) 430px, (min-width: 640px) 45vw, 100vw' }: Props) {
  return (
    <article className="post">
      <div className="post-photo">
        <Photo photo={PHOTOS[d.cover]} lang={lang} landscapeAt sizes={sizes} priority={priority} />
      </div>
      <p className="post-meta"><span>{d.tag}</span><time dateTime={d.date}>{formatDate(d.date, lang)}</time></p>
      <H className="post-title"><a href={href('blog', lang, d.path)}>{d.title}</a></H>
      <p className="post-excerpt">{d.excerpt}</p>
      <span className="visually-hidden">{UI[lang].readMore}</span>
    </article>
  );
}
