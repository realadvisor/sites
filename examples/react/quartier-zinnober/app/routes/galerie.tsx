// Galerie: the development's photos as an editorial sequence (mixed sizes),
// opened in a lightbox (native <dialog>, whole photo: app/client.ts lightbox()).
// Without JS each tile links to the large photo.
import type { Route } from './+types/galerie';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { Photo } from '../components/Photo';
import { Icon } from '../components/Icon';
import { site as load } from '../lib/data.server';
import './galerie.css';

// Rhythm: one wide, a pair, three; repeat.
const PATTERN = ['w', 'h', 'h', 't', 't', 't'] as const;
const SIZES = { w: '(min-width: 1360px) 1264px, 100vw', h: '(min-width: 900px) 50vw, 100vw', t: '(min-width: 900px) 33vw, 50vw' };

export async function loader() {
  const { dev } = await load();
  const photos = dev.photos;
  return {
    meta: {
      title: `Galerie: ${photos.length} Bilder | ${dev.title}`,
      description: `Bilder vom ${dev.title} in ${dev.address.city ?? ''}: Häuser, Hof und Wohnungen.`,
      image: photos[0] && img(photos[0].url, { w: 1200, h: 630 }),
    },
    photos: photos.map((p) => ({ ...p, large: img(p.url, { w: 1920, fit: 'fit', quality: 82 }) })),
  };
}

export default function Galerie({ loaderData: { meta, photos } }: Route.ComponentProps) {
  return (
    <Layout page="galerie" {...meta}>
      <PageHead title="Galerie" tone="butter">
        <p className="count"><span className="num">{photos.length}</span> Bilder</p>
      </PageHead>

      {photos.length > 0 ? (
        <section className="wrap gal" aria-label="Bilder">
          <ul className="grid" data-gallery="">
            {photos.map((p, i) => {
              const s = PATTERN[i % PATTERN.length]!;
              return (
                <li className={`g g--${s}`} key={p.url}>
                  <a href={p.large} data-lightbox={i} data-alt={p.alt} aria-label={`${p.alt}: gross anzeigen`}>
                    <Photo src={p} alt={p.alt ?? ''} width={s === 'w' ? 1600 : 900} height={s === 'w' ? 800 : 600} sizes={SIZES[s]} priority={i === 0} />
                    <span className="zoom" aria-hidden="true"><Icon name="expand" size={18} /></span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="wrap gal"><p className="lead">Bilder folgen in Kürze.</p></section>
      )}

      <dialog className="lb" data-lb="" aria-label="Bild gross">
        <div className="lb-bar">
          <p className="lb-count num" data-lb-count=""></p>
          <button type="button" className="lb-btn" data-lb-close=""><Icon name="close" size={24} /><span className="visually-hidden">Schliessen</span></button>
        </div>
        <figure className="lb-fig">
          <img data-lb-img="" alt="" />
          <figcaption data-lb-cap=""></figcaption>
        </figure>
        <button type="button" className="lb-btn lb-prev" data-lb-prev=""><Icon name="left" size={28} /><span className="visually-hidden">Vorheriges Bild</span></button>
        <button type="button" className="lb-btn lb-next" data-lb-next=""><Icon name="right" size={28} /><span className="visually-hidden">Nächstes Bild</span></button>
      </dialog>
    </Layout>
  );
}
