// Gallery: the development's photos as an editorial sequence, the
// construction photos (illustrations), and a lightbox that shows each photo
// whole (lightbox() in app/client.ts). Without JS every tile links to the large photo.
import type { CSSProperties } from 'react';
import type { Route } from './+types/galerie';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { ContactBand } from '../components/ContactBand';
import { BucketPhoto } from '../components/BucketPhoto';
import { AvifImage } from '../components/AvifImage';
import { loadSite } from '../lib/data.server';
import { CONSTRUCTION } from '../content/construction';
import './galerie.css';

export async function loader() {
  return { site: await loadSite() };
}

// Rows that always fill the width: one wide, a pair, a triple, again. Each
// row has its own height (aspect ratio), its tiles share it, so no gaps at
// any count; a short last row takes the template of its own length.
const PATTERN = [1, 2, 3] as const;
const COLS: Record<number, string[]> = { 1: ['1fr'], 2: ['7fr 5fr', '5fr 7fr'], 3: ['1fr 1fr 1fr'] };
// Box per tile (desktop): crop ratio for imgproxy, sizes for the browser.
const box = (n: number, j: number, flip: boolean) =>
  n === 1 ? { w: 1600, h: 800, sizes: '(min-width: 1400px) 1320px, 100vw' }
  : n === 2 ? ((j === 0) !== flip ? { w: 1100, h: 900, sizes: '(min-width: 760px) 55vw, 50vw' } : { w: 800, h: 900, sizes: '(min-width: 760px) 40vw, 50vw' })
  : { w: 800, h: 980, sizes: '(min-width: 760px) 31vw, 50vw' };
const large = (url: string) => img(url, { w: 2000, fit: 'fit', quality: 80 });

export default function Gallery({ loaderData }: Route.ComponentProps) {
  const { site } = loaderData;
  const { dev } = site;
  const photos = dev.photos.map((p, i) => ({ ...p, n: i + 1 }));
  const rows: (typeof photos)[] = [];
  for (let i = 0, r = 0; i < photos.length; r++) {
    const n = PATTERN[r % PATTERN.length]!;
    rows.push(photos.slice(i, i + n));
    i += n;
  }
  return (
    <Layout
      title={`Galerie | ${dev.title}`}
      description={`Images des ${dev.title.replace(/^Les /, '')} à ${dev.address.city} : architecture, intérieurs, vues sur le Léman et étapes du chantier.`}
      image={photos[0] && img(photos[0].url, { w: 1200, h: 630 })}
    >
      <section className="wrap intro gal-intro">
        <h1>Galerie</h1>
        <p className="lede muted">{photos.length} images du projet, visuels non contractuels. Chaque image s’ouvre en grand.</p>
      </section>

      <section className="wrap seq" aria-label="Images du projet">
        {rows.map((row, r) => {
          const variants = COLS[row.length]!;
          const flip = row.length === 2 && Math.floor(r / PATTERN.length) % 2 === 1;
          return (
            <div key={r} className={`row n${row.length}`} style={{ '--cols': variants[flip ? 1 : 0] } as CSSProperties}>
              {row.map((p, j) => {
                const b = box(row.length, j, flip);
                return (
                  <a key={p.n} href={large(p.url)} className="tile zoom" id={`photo-${p.n}`} data-lightbox="" data-alt={p.alt || dev.title} aria-label={`${p.alt || dev.title}, agrandir`}>
                    {p.n === 1
                      ? <Photo src={p} alt={p.alt || dev.title} width={b.w} height={b.h} sizes={b.sizes} priority mobile={{ width: 800, height: 600 }} widths={[640, 960, 1280]} quality={58} />
                      : <AvifImage src={p.url} alt={p.alt || `${dev.title}, photo ${p.n}`} width={b.w} height={b.h} sizes={b.sizes} />}
                  </a>
                );
              })}
            </div>
          );
        })}
      </section>

      <section className="build" aria-labelledby="c-h">
        <div className="wrap">
          <div className="build-head">
            <h2 id="c-h">Les étapes de la construction</h2>
            <p className="muted small">Images d’illustration d’un chantier résidentiel : elles ne montrent pas ce projet.</p>
          </div>
          <ol className="strip">
            {CONSTRUCTION.map((p, i) => (
              <li key={p.url}>
                <a href={img(p.url, { w: 1600, fit: 'fit' })} className="tile zoom" data-lightbox="" data-alt={`${p.stage} : ${p.alt} (image d’illustration)`} aria-label={`${p.stage}, agrandir l’image d’illustration`}>
                  <BucketPhoto src={p.url} width={p.width} height={p.height} alt={p.alt} sizes="(min-width: 1000px) 19vw, 70vw" />
                </a>
                <p className="stage"><span className="num">{String(i + 1).padStart(2, '0')}</span> {p.stage}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <dialog className="lightbox" aria-label="Image agrandie" data-dialog="">
        <div className="lb-bar">
          <p className="lb-count" aria-live="polite" data-count=""></p>
          <button type="button" className="lb-btn" data-close="">Fermer <span aria-hidden="true">×</span></button>
        </div>
        <figure className="lb-fig">
          <img alt="" data-img="" />
          <figcaption data-cap=""></figcaption>
        </figure>
        <button type="button" className="lb-nav prev" data-prev="" aria-label="Image précédente"><svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true"><path d="M27 7H2M7 1 1 7l6 6" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg></button>
        <button type="button" className="lb-nav next" data-next="" aria-label="Image suivante"><svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true"><path d="M1 7h25M21 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg></button>
      </dialog>

      <ContactBand site={site} />
    </Layout>
  );
}
