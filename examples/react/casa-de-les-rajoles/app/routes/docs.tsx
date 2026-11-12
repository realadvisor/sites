/** Documents (/documentos, /en/documents): the generated PDFs (dossier, price list, plans) and every plan as SVG. */
import type { Route } from './+types/docs';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { loadSite } from '../lib/data.server';
import { alternates, fill, langOfPath, longDate, tr } from '../lib/i18n';
import { DOCS, docsFor } from '../lib/docs';
import { kindLabel, planSrc, planVariants } from '../lib/units.server';
import './docs.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const t = tr(lang);
  const { dev } = await loadSite();
  const vTitle = (v: ReturnType<typeof planVariants>[number]) => (v.kind === 'atico' ? `${t.kinds.atico[0]}, ${fill(t.bedroomsN, { n: v.bedrooms })}` : kindLabel(v.kind, lang));
  return {
    lang,
    title: dev.title,
    image: dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 }),
    plans: planVariants(dev.units).map((v) => ({ key: v.key, href: planSrc(v.key, lang), label: `${vTitle(v)} · ${t.wings[v.wing]}` })),
  };
}

export default function Docs({ loaderData: d }: Route.ComponentProps) {
  const { lang } = d;
  const t = tr(lang);
  const kb = (b: number) => `${new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', { maximumFractionDigits: 0 }).format(Math.max(1, Math.round(b / 1024)))} KB`;
  const lead = fill(t.docsLead, { d: longDate(DOCS.updated, lang) });
  return (
    <Layout lang={lang} route="docs" title={`${t.docsTitle} | ${d.title}`} description={lead} image={d.image} alternates={alternates('docs')} page="pg-docs">
      <section className="wrap head">
        <h1>{t.docsTitle}</h1>
        <p className="lede">{lead}</p>
      </section>
      <section className="wrap">
        <ul className="docs">
          {docsFor(lang).map((f) => (
            <li key={f.id}>
              <a href={f.href} download>
                <span className="t">{f.title}</span>
                <span className="d">{f.description}</span>
                <span className="m num">PDF · {f.pages === 1 ? t.pageOne : fill(t.pages, { n: f.pages })} · {kb(f.bytes)}</span>
                <span className="go"><Icon name="download" size={20} /> {t.download}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section className="wrap plans" aria-labelledby="p-h">
        <h2 id="p-h">{t.docsPlans}</h2>
        <p className="muted">{t.docsPlansLead}</p>
        <ul>
          {d.plans.map((p) => <li key={p.key}><a href={p.href}>{p.label}</a></li>)}
        </ul>
      </section>
    </Layout>
  );
}
