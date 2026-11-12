// Documents: brochure, price list and plans as PDFs (generated from our own
// HTML by the Astro version's scripts/documents.mjs into public/documents/;
// the API has no documents yet: fixture only), plus every plan as an image.
import type { Route } from './+types/documents';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { ContactBand } from '../components/ContactBand';
import { Arrow } from '../components/Arrow';
import { loadSite } from '../lib/data.server';
import { unitTypes, planFor, formatRooms } from '../lib/units';
import DOCS from '../content/documents.json';
import './documents.css';

export async function loader() {
  const site = await loadSite();
  const { dev } = site;
  // Every distinct plan drawing in use, with the types it shows.
  const plans = [...new Map(dev.units.map((u) => [planFor(u, dev.units), u] as const)).entries()]
    .filter((e): e is [string, (typeof dev.units)[number]] => !!e[0])
    .map(([src, u]) => ({ src, label: `${formatRooms(u.rooms)}${src.includes('attique') ? ', attique' : src.includes('jardin') ? ', rez-de-jardin' : ''}`, rooms: u.rooms ?? 0, garden: src.includes('jardin') }))
    .sort((a, b) => a.rooms - b.rooms || Number(b.garden) - Number(a.garden));
  return { site, types: unitTypes(dev.units).map((t) => t.label), plans };
}

const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} Ko`;
const date = (d: string) => new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));

export default function Documents({ loaderData }: Route.ComponentProps) {
  const { site, types, plans } = loaderData;
  const { dev } = site;
  return (
    <Layout
      title={`Documents : brochure, plans et liste de prix | ${dev.title}`}
      description={`Téléchargez la brochure, la liste de prix et les plans des ${dev.title.replace(/^Les /, '')} (PDF).`}
      image={dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 })}
    >
      <section className="wrap intro docs-intro">
        <h1>Documents</h1>
        <p className="lede muted">Brochure, liste de prix et plans en PDF, non contractuels, mis à jour le {date(DOCS.updated)}.</p>
      </section>

      <section className="wrap docs" aria-label="Téléchargements">
        <ul>
          {DOCS.files.map((d, i) => (
            <li key={d.href}>
              <a href={d.href} download className="doc">
                <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="t">{d.title}</span>
                <span className="d">{d.description}</span>
                <span className="m">PDF · {d.pages} {d.pages > 1 ? 'pages' : 'page'} · {kb(d.bytes)}</span>
                <span className="dl"><Arrow dir="down" /><span className="sr-only">Télécharger</span></span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap plans" aria-labelledby="p-h">
        <div className="head">
          <h2 id="p-h">Plans par typologie</h2>
          <p className="muted">Tous les plans sont dessinés à la même échelle. {types.length} typologies, du {types[0]} au {types[types.length - 1]}.</p>
        </div>
        <ul className="grid">
          {plans.map((p) => (
            <li key={p.src}>
              <a href={p.src} className="plan" aria-label={`Plan indicatif ${p.label}, ouvrir l’image`}>
                <img src={p.src} alt={`Plan indicatif, ${p.label}`} width="1000" height="720" loading="lazy" decoding="async" />
              </a>
              <p className="pl">{p.label}</p>
            </li>
          ))}
        </ul>
      </section>

      <ContactBand site={site} heading="Plans et descriptif d’un lot sur demande" />
    </Layout>
  );
}
