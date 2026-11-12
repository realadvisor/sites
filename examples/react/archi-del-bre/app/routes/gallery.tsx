/**
 * Gallery: the development's photos as an editorial sequence (a wide photo,
 * a pair, a tall one beside two), then the construction site (fixture only).
 * Every photo opens whole in the lightbox; without JS the link opens it.
 */
import type { Route } from './+types/gallery';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { Lightbox } from '../components/Lightbox';
import { loadSite } from '../lib/data.server';
import { developmentExtra } from '../lib/extras';
import { langOf } from '../lib/routes';
import { c } from '../lib/copy';
import { deliveryLabel } from '../lib/units';
import { photoAlt } from '../content/photo-alts';
import './gallery.css';

export async function loader({ request }: Route.LoaderArgs) {
  return { l: langOf(new URL(request.url).pathname), site: await loadSite(request) };
}

// Layout pattern, repeated: wide, pair, tall + two.
const shapes = ['wide', 'half', 'half', 'tall', 'quarter', 'quarter'] as const;
const dims = { wide: [1600, 860], half: [900, 680], tall: [800, 1040], quarter: [800, 600] } as const;
const sizes = { wide: '(max-width: 760px) 100vw, 90vw', half: '(max-width: 760px) 50vw, 45vw', tall: '(max-width: 760px) 100vw, 45vw', quarter: '(max-width: 760px) 50vw, 45vw' };

export default function Gallery({ loaderData: { l, site } }: Route.ComponentProps) {
  const { dev } = site;
  const photos = dev.photos;
  const build = developmentExtra(dev).construction_photos ?? []; // fixture only: construction photos
  const T = {
    it: {
      title: `Galleria | ${dev.title}`,
      h1: 'Galleria',
      intro: `${photos.length} foto della residenza e delle finiture, e lo stato del cantiere.`,
      site: 'Il cantiere',
      siteP: `Lavori in corso, consegna prevista ${deliveryLabel(dev, 'it')}.`,
      siteAlt: (n: number) => `Cantiere della ${dev.title}, foto ${n}`,
    },
    de: {
      title: `Galerie | ${dev.title}`,
      h1: 'Galerie',
      intro: `${photos.length} Fotos der Residenz und des Ausbaus, dazu der Stand der Baustelle.`,
      site: 'Die Baustelle',
      siteP: `Die Bauarbeiten laufen, Bezug geplant ${deliveryLabel(dev, 'de')}.`,
      siteAlt: (n: number) => `Baustelle der ${dev.title}, Foto ${n}`,
    },
  }[l];
  const alt = (i: number) => photoAlt(photos[i]!.url, l, `${dev.title}, ${c('photo', l)} ${i + 1}`);
  // End of the run: a tall photo needs two beside it, a half photo its pair; otherwise the last one goes wide.
  const shapeOf = (i: number) => {
    const s = shapes[i % shapes.length]!;
    const left = photos.length - i;
    if (s === 'tall' && left < 3) return 'wide';
    if (s === 'quarter' && i % shapes.length === 4 && left < 2) return 'wide';
    if (s === 'half' && i % shapes.length === 1 && left < 2) return 'wide';
    return s;
  };
  const lb = (url: string) => img(url, { w: 2000, fit: 'fit', quality: 78 });
  return (
    <Layout l={l} route="gallery" scope="v-gallery" title={T.title} description={T.intro} image={photos[0] ? img(photos[0].url, { w: 1200, h: 630 }) : undefined}>
      <div className="wrap head">
        <h1 className="h1">{T.h1}</h1>
        <p className="lede">{T.intro}</p>
      </div>
      <div className="wrap seq">
        {photos.map((p, i) => {
          const s = shapeOf(i);
          const [w, h] = dims[s];
          return (
            <a key={p.url} className={`tile ${s}`} href={lb(p.url)} data-lightbox="" data-alt={alt(i)}>
              <Photo src={p.url} alt={alt(i)} width={w} height={h} sizes={sizes[s]} priority={i === 0} />
            </a>
          );
        })}
      </div>
      {build.length > 0 && (
        <section className="wrap build" aria-labelledby="site-h">
          <div className="b-head">
            <h2 id="site-h" className="h2">{T.site}</h2>
            <p className="muted">{T.siteP}</p>
          </div>
          <div className="b-grid">
            {build.map((u, i) => (
              <a key={u} className="tile" href={lb(u)} data-lightbox="" data-alt={T.siteAlt(i + 1)}>
                <Photo src={u} alt={T.siteAlt(i + 1)} width={800} height={600} sizes="(max-width: 760px) 50vw, 25vw" />
              </a>
            ))}
          </div>
        </section>
      )}
      <Lightbox l={l} />
    </Layout>
  );
}
