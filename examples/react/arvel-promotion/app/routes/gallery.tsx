// Gallery: every photo of the programme, then the construction photos.
import type { Route } from './+types/gallery';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Layout } from '../components/Layout';
import { Hero } from '../components/Hero';
import { Gallery as PhotoGallery, type GalleryPhoto } from '../components/Gallery';
import { Lightbox } from '../components/Lightbox';
import { EnquiryBlock } from '../components/EnquiryBlock';
import { developmentExtra, sites } from '../lib/data.server';
import { contentFor } from '../content/programmes';
import { constructionFor } from '../content/construction';
import { plural } from '../lib/fr';
import { ogImage } from '../lib/seo';
import './gallery.css';

export async function loader({ params }: Route.LoaderArgs) {
  const d = await sites.development(params.slug);
  if (!d) throw notFound();
  // fixture only: construction_photos
  return { d, construction: developmentExtra(d).construction_photos ?? [] };
}

export default function Gallery({ loaderData: { d, construction } }: Route.ComponentProps) {
  const c = contentFor(d.slug);
  const hero = d.photos[c.hero ?? 0] ?? d.photos[0];
  const photos = d.photos.filter((p) => p.url !== hero?.url).map((p, i) => ({ url: p.url, alt: p.alt || `${d.title}, photo ${i + 2}` }));
  const seen = new Set(d.photos.map((p) => p.url));
  // Site illustration photos (content/construction.ts) win; otherwise the
  // fixture only: construction_photos, minus those already in the gallery.
  const illustrations = constructionFor(d.slug);
  const site: GalleryPhoto[] = illustrations.length > 0
    ? illustrations.map((p) => ({ local: p.name, alt: p.alt }))
    : construction.filter((u) => !seen.has(u)).map((u, i) => ({ url: u, alt: `${d.title}, chantier, photo ${i + 1}` }));
  const siteTitle = d.status === 'delivered' ? 'Retour sur le chantier' : d.status === 'construction' ? 'Le chantier' : 'Le projet';
  return (
    <Layout
      title={`Galerie · ${d.title} | Arvel Promotion`}
      description={`${plural(d.photos.length + site.length, 'photo', 'photos')} de ${d.title}, ${d.address.city ?? ''}.`}
      image={ogImage(hero?.url)}
      programme={d}
      section="gallery"
      current="programmes"
      hero={<Hero size="band" photo={hero?.url} alt={hero?.alt ?? d.title} kicker={d.title} title="Galerie" line={plural(d.photos.length, 'photo', 'photos')} />}
    >
      <section className="section section--tight" aria-labelledby="h-g">
        <div className="wrap">
          <h2 id="h-g" className="sr-only">Photos de {d.title}</h2>
          {photos.length > 0 ? <PhotoGallery photos={photos} id="programme" /> : <p className="muted">Les photos de ce programme arrivent bientôt.</p>}
        </div>
      </section>

      {site.length > 0 && (
        <section className="section section--tight section--deep" aria-labelledby="h-s">
          <div className="wrap">
            <div className="gl-shead">
              <h2 id="h-s" className="display">{siteTitle}</h2>
              {illustrations.length > 0 && <p className="muted gl-note">Photos d’illustration d’un chantier résidentiel : elles ne montrent pas ce programme.</p>}
            </div>
            <PhotoGallery photos={site} id="site" />
          </div>
        </section>
      )}
      <p className="wrap gl-disclaimer muted">Visuels non contractuels.</p>
      <Lightbox />
      <EnquiryBlock programme={d} />
    </Layout>
  );
}
