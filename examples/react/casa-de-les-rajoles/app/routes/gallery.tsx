/**
 * Gallery (/galeria, /en/gallery): the development's photos in an editorial
 * run of single and paired frames, then the works (fixture only:
 * construction photos). Each photo links to its full-size file;
 * app/client.ts turns that into a lightbox with arrows, Escape and a counter.
 */
import type { Route } from './+types/gallery';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { developmentExtra, loadSite } from '../lib/data.server';
import { CONTENT_LANG, alternates, fill, langOfPath, tr } from '../lib/i18n';
import './gallery.css';

// Layout rhythm: wide, pair, tall + square, wide, pair...
const SHAPES = ['wide', 'half', 'half', 'tall', 'sq', 'third', 'third', 'third', 'half', 'half'];
const DIMS: Record<string, [number, number, string]> = {
  wide: [1600, 900, '(min-width: 1376px) 1280px, 100vw'],
  half: [800, 600, '(min-width: 900px) 50vw, 100vw'],
  tall: [800, 1000, '(min-width: 900px) 42vw, 100vw'],
  sq: [900, 1000, '(min-width: 900px) 58vw, 100vw'],
  third: [600, 700, '(min-width: 900px) 33vw, 50vw'],
};

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const t = tr(lang);
  const { dev } = await loadSite();
  const works = developmentExtra(dev).construction_photos ?? []; // fixture only: construction photos
  const big = (u: string) => img(u, { w: 1800, fit: 'fit', quality: 75 });
  const shots = dev.photos.map((p, i) => ({ url: p.url, big: big(p.url), alt: i === 0 ? (lang === 'es' ? 'Fachada de 1908 de Casa de les Rajoles' : 'The 1908 façade of Casa de les Rajoles') : p.alt, lang: i === 0 ? undefined : CONTENT_LANG }));
  const workShots = works.map((url, i) => ({ url, big: big(url), alt: lang === 'es' ? `Obras de Casa de les Rajoles, foto ${i + 1}` : `Casa de les Rajoles under construction, photo ${i + 1}`, lang: undefined }));
  return {
    lang,
    shots,
    workShots,
    title: `${t.galleryTitle} | ${dev.title}`,
    description: `${t.galleryLead} ${dev.title}, Russafa, València.`,
    image: dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 }),
  };
}

export default function Gallery({ loaderData: d }: Route.ComponentProps) {
  const { lang, shots, workShots } = d;
  const t = tr(lang);
  const all = [...shots, ...workShots];
  const label = (i: number) => `${t.openPhoto}: ${fill(t.photoOf, { i: i + 1, n: all.length })}`;
  return (
    <Layout lang={lang} route="gallery" title={d.title} description={d.description} image={d.image} alternates={alternates('gallery')} page="pg-gallery">
      <section className="wrap head">
        <h1>{t.galleryTitle}</h1>
        <p className="lede">{t.galleryLead}</p>
      </section>
      <div className="wrap run" data-gallery="">
        {shots.map((p, i) => {
          const s = SHAPES[i % SHAPES.length]!;
          const [w, h, sizes] = DIMS[s]!;
          return (
            <a key={p.url} className={`shot ${s}`} href={p.big} data-i={i} aria-label={label(i)}>
              <Photo src={p.url} alt={p.alt} lang={p.lang} width={w} height={h} sizes={sizes} priority={i === 0} />
            </a>
          );
        })}
      </div>
      {workShots.length > 0 && (
        <section className="wrap works" id="obras" aria-labelledby="o-h">
          <h2 id="o-h">{t.galleryWorks}</h2>
          <div className="w-grid" data-gallery="">
            {workShots.map((p, j) => (
              <a key={p.url} className="shot" href={p.big} data-i={shots.length + j} aria-label={label(shots.length + j)}>
                <Photo src={p.url} alt={p.alt} width={600} height={720} sizes="(min-width: 900px) 25vw, 50vw" />
              </a>
            ))}
          </div>
        </section>
      )}
      <dialog className="lb" data-lightbox="" aria-label={t.galleryTitle} data-of={t.photoOf}>
        <img data-lb-img="" alt="" />
        <p className="count" data-lb-count="" aria-live="polite"></p>
        <button type="button" className="prev" data-lb-prev="">{t.prev}</button>
        <button type="button" className="next" data-lb-next="">{t.next}</button>
        <button type="button" className="x" data-lb-close="">{t.close}</button>
      </dialog>
      <template data-lb-list="">{all.map((p) => <span key={p.url} data-src={p.big} data-alt={p.alt}></span>)}</template>
    </Layout>
  );
}
