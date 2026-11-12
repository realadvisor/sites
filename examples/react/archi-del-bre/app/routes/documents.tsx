/** Documents: the PDFs we generate from our own HTML (fixture only: the API has no documents yet), per language. */
import type { Route } from './+types/documents';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { loadSite } from '../lib/data.server';
import { href, langOf } from '../lib/routes';
import { c } from '../lib/copy';
import { DOCS, docsFor } from '../lib/docs';
import './documents.css';

export async function loader({ request }: Route.LoaderArgs) {
  return { l: langOf(new URL(request.url).pathname), site: await loadSite(request) };
}

const kb = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function Documents({ loaderData: { l, site } }: Route.ComponentProps) {
  const { dev } = site;
  const files = docsFor(l);
  const date = new Intl.DateTimeFormat(l === 'de' ? 'de-CH' : 'it-CH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(DOCS.updated));
  const T = {
    it: {
      title: `Documenti: brochure, listino prezzi e piante | ${dev.title}`,
      h1: 'Documenti',
      intro: 'Brochure, listino prezzi e piante indicative da scaricare. Il capitolato completo lo inviamo su richiesta.',
      updated: `Aggiornati al ${date}.`,
      pages: (n: number) => `${n} ${n === 1 ? 'pagina' : 'pagine'}`,
      ask: 'Capitolato e documenti tecnici su richiesta',
    },
    de: {
      title: `Dokumente: Broschüre, Preisliste und Grundrisse | ${dev.title}`,
      h1: 'Dokumente',
      intro: 'Broschüre, Preisliste und indikative Grundrisse zum Herunterladen. Den vollständigen Baubeschrieb senden wir auf Anfrage.',
      updated: `Stand ${date}.`,
      pages: (n: number) => `${n} ${n === 1 ? 'Seite' : 'Seiten'}`,
      ask: 'Baubeschrieb und technische Unterlagen auf Anfrage',
    },
  }[l];
  const cover = dev.photos[0];
  return (
    <Layout l={l} route="documents" scope="v-documents" title={T.title} description={T.intro} image={cover ? img(cover.url, { w: 1200, h: 630 }) : undefined}>
      <div className="wrap grid">
        <div className="head">
          <h1 className="h1">{T.h1}</h1>
          <p className="lede">{T.intro}</p>
          <p className="muted">{T.updated}</p>
        </div>
        <ul className="docs">
          {files.map((d) => (
            <li key={d.href}>
              <a href={d.href} download>
                <span className="t">{d.title}</span>
                <span className="d muted">{d.description}</span>
                <span className="m num">PDF · {T.pages(d.pages)} · {kb(d.bytes)}</span>
                <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8m0 0 3.2-3.2M8 10 4.8 6.8M3 13h10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </li>
          ))}
          <li className="ask"><a href={href('contact', l)}><span className="t">{T.ask}</span><span className="d muted">{c('writeUs', l)}</span></a></li>
        </ul>
      </div>
    </Layout>
  );
}
