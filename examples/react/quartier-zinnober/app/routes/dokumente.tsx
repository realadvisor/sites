// Dokumente: brochure, rent list and plans as PDFs (public/documents), plus each unit type's plan.
import type { Route } from './+types/dokumente';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { Icon } from '../components/Icon';
import { rowsOf, site as load } from '../lib/data.server';
import { surface, types } from '../lib/units';
import docs from '../lib/documents.json';
import './dokumente.css';

const size = (b: number) => `${new Intl.NumberFormat('de-CH', { maximumFractionDigits: b > 1e6 ? 1 : 0 }).format(b > 1e6 ? b / 1e6 : b / 1e3)} ${b > 1e6 ? 'MB' : 'kB'}`;
const date = (iso: string) => new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00Z`));
const TONES = ['zinnober', 'lilac', 'butter'];

export async function loader() {
  const { dev } = await load();
  return {
    meta: {
      title: `Dokumente: Broschüre, Mietzinsliste, Grundrisse | ${dev.title}`,
      description: `Broschüre, Mietzinsliste und Grundrisse des ${dev.title} als PDF zum Herunterladen.`,
    },
    typeList: types(rowsOf(dev)).filter((t) => t.plan),
  };
}

export default function Dokumente({ loaderData: { meta, typeList } }: Route.ComponentProps) {
  return (
    <Layout page="dokumente" {...meta}>
      <PageHead title="Dokumente" lead="Alles zum Herunterladen: die Broschüre, die aktuelle Mietzinsliste und die Grundrisse aller Wohnungstypen." tone="sand" />

      <section className="wrap docs">
        <ul className="list">
          {docs.map((d, i) => (
            <li className={`doc doc--${TONES[i % TONES.length]}`} key={d.file}>
              <a href={d.file} download="">
                <span className="ic" aria-hidden="true"><Icon name="file" size={30} /></span>
                <span className="nm">{d.name}</span>
                <span className="tx">{d.text}</span>
                <span className="meta">PDF · <span className="num">{d.pages} {d.pages === 1 ? 'Seite' : 'Seiten'} · {size(d.bytes)}</span> · Stand {date(d.date)}</span>
                <span className="dl"><Icon name="download" size={22} /> Herunterladen</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="band band--sand plans">
        <div className="wrap">
          <h2 className="h">Grundrisse einzeln</h2>
          <ul className="pl">
            {typeList.map((t) => (
              <li key={t.rooms}>
                <a href={t.plan} download={`quartier-zinnober-grundriss-${String(t.rooms).replace('.', '-')}-zimmer.svg`}>
                  <img src={t.plan} width="600" height="470" loading="lazy" decoding="async" alt={`Grundriss indikativ, ${String(t.rooms)} Zimmer`} />
                  <span className="row"><strong>{String(t.rooms)} Zimmer</strong>{t.surface && <span className="num">{surface(t.surface)}</span>}<span className="svg"><Icon name="download" size={18} /> SVG</span></span>
                </a>
              </li>
            ))}
          </ul>
          <p className="muted note">Grundrisse indikativ, nicht massgebend. Massgebend sind die Ausführungspläne.</p>
        </div>
      </section>
    </Layout>
  );
}
