// Generates the programme documents (brochure, plans, price list) as real PDFs
// from the site's own HTML with Playwright, into public/documents/, and writes
// src/content/documents.json (title, size, pages, date) for the pages.
// Data: src/data/fixture.json (the same data the site reads). Run: pnpm documents
import { mkdirSync, readFileSync, statSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PLANS, nominalSurface, planFor, planTree, toSvg } from '../src/lib/plans.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const fx = JSON.parse(readFileSync(join(root, 'src/data/fixture.json'), 'utf8'));
const places = JSON.parse(readFileSync(join(root, 'src/content/places.json'), 'utf8'));
const outDir = join(root, 'public/documents');
mkdirSync(outDir, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);

// Same art direction as src/content/programmes.ts (kept in sync by hand: a script cannot import the Astro content module).
const ART: Record<string, { hero: number; line: string; place: string; placeName: string; situation: string }> = {
  'les-balcons-du-semnoz': { hero: 1, line: 'Annecy, pentes du Semnoz', place: 'annecy', placeName: 'Annecy', situation: 'Sur les premières pentes du Semnoz, au sud-ouest d’Annecy : les balcons s’ouvrent sur le lac et les montagnes, le centre ancien et le Pâquier sont à quelques minutes.' },
  'quai-des-tanneurs': { hero: 3, line: 'Lyon 7e, Gerland', place: 'lyon', placeName: 'Lyon, Gerland', situation: 'À Gerland, au sud du 7e arrondissement : berges aménagées, parc de Gerland à pied et la presqu’île en quelques stations de métro.' },
  'le-clos-des-tilleuls': { hero: 0, line: 'Écully, ouest de Lyon', place: 'lyon', placeName: 'Écully', situation: 'À Écully, à l’ouest de Lyon : un parc arboré à l’écart des grands axes, le centre du village et ses commerces à pied.' },
};

const IMGPROXY = 'https://img.realadvisor.ch';
const b64 = (s: string) => Buffer.from(s).toString('base64url');
const img = (url: string, w: number, h: number) => `${IMGPROXY}/_/rs:fill:${w}:${h}:1:0/q:62/${b64(url)}.jpg`;
const eur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const m2 = (n?: number) => (n == null ? '' : `${new Intl.NumberFormat('fr-FR').format(n)} m²`);
const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const floor = (u: any) => u.floor_label ?? (u.floor === 0 ? 'Rez-de-chaussée' : u.floor === 1 ? '1er étage' : `${u.floor}e étage`);
const STATUS: Record<string, string> = { available: 'Disponible', reserved: 'Réservé', sold: 'Vendu' };
const ORIENT: Record<string, string> = { N: 'Nord', NE: 'Nord-est', E: 'Est', SE: 'Sud-est', S: 'Sud', SW: 'Sud-ouest', W: 'Ouest', NW: 'Nord-ouest' };
const NAMES: Record<string, string> = { T1: 'Studio', T2: 'Deux pièces', T3: 'Trois pièces', T4: 'Quatre pièces', T5: 'Cinq pièces' };
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const delivery = (d: any) => {
  if (!d.delivery_date) return '';
  const [y, m] = d.delivery_date.split('-').map(Number);
  return d.status === 'delivered' ? `Livré en ${MONTHS[m - 1]} ${y}` : `Livraison prévue au ${['1er', '2e', '3e', '4e'][Math.floor((m - 1) / 3)]} trimestre ${y}`;
};
const fontDir = join(root, 'src/fonts');
const jost = join(root, 'node_modules/@fontsource-variable/jost/files/jost-latin-wght-normal.woff2');
const team = fx.teams.find((t: any) => t.primary) ?? fx.teams[0];
const today = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date());

const css = `
@font-face { font-family: 'Cormorant Garamond'; font-weight: 500; src: url('file://${fontDir}/cormorant-garamond-500-normal-lf.woff2'); }
@font-face { font-family: 'Cormorant Garamond'; font-weight: 500; font-style: italic; src: url('file://${fontDir}/cormorant-garamond-500-italic-lf.woff2'); }
@font-face { font-family: 'Jost'; font-weight: 100 900; src: url('file://${jost}'); }
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font: 10.5pt/1.55 Jost, sans-serif; color: #0E1A24; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 297mm; height: 210mm; position: relative; overflow: hidden; page-break-after: always; padding: 16mm 18mm; }
.page:last-child { page-break-after: auto; }
.ink { background: #0E1A24; color: #EEE8DD; }
.paper { background: #F2EDE4; }
.serif { font-family: 'Cormorant Garamond', serif; font-weight: 500; }
.eyebrow { font-size: 7.5pt; letter-spacing: .28em; text-transform: uppercase; color: #C9A675; margin: 0 0 6mm; }
.paper .eyebrow { color: #7A5C30; }
h1, h2, h3 { font-family: 'Cormorant Garamond', serif; font-weight: 500; margin: 0; line-height: 1; }
h1 { font-size: 54pt; text-transform: uppercase; letter-spacing: .02em; }
h1 em, h2 em { display: block; font-style: normal; text-transform: none; font-size: .55em; font-family: 'Jost', sans-serif; color: inherit; opacity: .8; margin-top: 3mm; }
h2 { font-size: 34pt; }
.paper h2 em { color: inherit; }
.cover { padding: 0; }
.cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.cover .shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(7,14,20,.92), rgba(7,14,20,.15) 65%); }
.cover .txt { position: absolute; left: 18mm; right: 18mm; bottom: 16mm; color: #EEE8DD; }
.wm { position: absolute; top: 14mm; left: 18mm; color: #EEE8DD; font-family: 'Cormorant Garamond'; letter-spacing: .34em; font-size: 22pt; line-height: 1; z-index: 2; }
.wm small { display: block; font: 7pt Jost; letter-spacing: .5em; margin-top: 2mm; }
.foot { position: absolute; left: 18mm; right: 18mm; bottom: 8mm; display: flex; justify-content: space-between; font-size: 7pt; color: #56606A; }
.ink .foot { color: #A8B1B7; }
.cols { display: grid; grid-template-columns: 1.1fr 1fr; gap: 14mm; height: 100%; }
.facts { border-top: .3mm solid #CFC6B8; margin: 0; }
.ink .facts { border-color: rgba(238,232,221,.25); }
.facts div { display: grid; grid-template-columns: 42mm 1fr; padding: 2.6mm 0; border-bottom: .3mm solid #CFC6B8; }
.ink .facts div { border-color: rgba(238,232,221,.16); }
.facts dt { font-size: 7pt; letter-spacing: .2em; text-transform: uppercase; color: #56606A; }
.ink .facts dt { color: #A8B1B7; }
.facts dd { margin: 0; }
.photo { width: 100%; height: 100%; object-fit: cover; display: block; }
.lead { font-family: 'Cormorant Garamond'; font-size: 19pt; line-height: 1.2; margin: 0 0 6mm; }
table { width: 100%; border-collapse: collapse; font-size: 9pt; }
th, td { text-align: left; padding: 2.2mm 2mm; border-bottom: .3mm solid #CFC6B8; }
th { font-size: 6.5pt; letter-spacing: .18em; text-transform: uppercase; color: #56606A; font-weight: 500; }
.r { text-align: right; }
tr.sold td { color: #8a9096; }
.types { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); grid-auto-flow: column; gap: 4mm; margin-top: 12mm; }
.types div { background: #fff; padding: 3mm; }
.types img { width: 100%; height: 78mm; object-fit: contain; margin: 4mm 0; }
.types b { font-family: 'Cormorant Garamond'; font-size: 20pt; font-weight: 500; display: block; }
.plan-page { display: grid; grid-template-columns: 1fr 70mm; gap: 12mm; height: 100%; }
.plan-page svg { width: 100%; height: 160mm; }
.small { font-size: 8pt; color: #56606A; }
`;
const wordmark = `<div class="wm">ARVEL<small>PROMOTION</small></div>`;
const footer = (d: any, label: string, n: number) =>
  `<div class="foot"><span>${esc(d.title)} · ${esc(label)}</span><span>Arvel Promotion · Document non contractuel · ${today}</span><span>${n}</span></div>`;

function brochure(d: any) {
  const a = ART[d.slug] ?? { hero: 0, line: '', place: '', placeName: d.address.city, situation: '' };
  const x = fx.fixture_only.developments[d.id] ?? {};
  const hero = d.photos[a.hero] ?? d.photos[0];
  const p2 = d.photos[(a.hero + 1) % d.photos.length];
  const place = places[a.place]?.[0];
  const types = [...new Set(d.units.map((u: any) => `T${u.rooms}`))].sort() as string[];
  const avail = d.units.filter((u: any) => u.status === 'available');
  const paras = (d.description_text ?? '').split(/\n\s*\n/);
  const agent = d.agents[0];
  let n = 0;
  return `
  <section class="page cover"><img src="${img(hero.url, 1800, 1272)}">${'<div class="shade"></div>'}${wordmark}
    <div class="txt"><p class="eyebrow">${esc(d.address.city)} · ${d.stats.units} logements</p><h1>${esc(d.title)}<em>${esc(a.line)}</em></h1>
    <p style="margin-top:6mm;font-size:11pt">${esc(delivery(d))}</p></div></section>
  <section class="page paper"><div class="cols"><div>
    <p class="eyebrow">Le programme</p><p class="lead">${esc(paras[0] ?? '')}</p>${paras.slice(1).map((p: string) => `<p>${esc(p)}</p>`).join('')}
    <dl class="facts" style="margin-top:8mm">
      <div><dt>Adresse</dt><dd>${esc([d.address.street, `${d.address.postcode} ${d.address.city}`].join(', '))}</dd></div>
      <div><dt>Logements</dt><dd>${d.stats.units}, du T${d.stats.rooms.min} au T${d.stats.rooms.max}</dd></div>
      <div><dt>Surfaces</dt><dd>${d.stats.living_surface.min} à ${m2(d.stats.living_surface.max)}</dd></div>
      <div><dt>Livraison</dt><dd>${esc(delivery(d))}</dd></div>
      ${x.architect ? `<div><dt>Architecte</dt><dd>${esc(x.architect)}</dd></div>` : ''}
      ${x.general_contractor ? `<div><dt>Entreprise générale</dt><dd>${esc(x.general_contractor)}</dd></div>` : ''}
    </dl></div><div><img class="photo" src="${img(p2.url, 1000, 1180)}"></div></div>${footer(d, 'Brochure', ++n + 1)}</section>
  <section class="page ink"><p class="eyebrow">Typologies</p><h2>Du ${types[0] === 'T1' ? 'studio' : types[0]} au ${types[types.length - 1]}</h2>
    <div class="types">${types.map((t) => {
      const us = d.units.filter((u: any) => `T${u.rooms}` === t);
      const av = us.filter((u: any) => u.status === 'available');
      const s = us.map((u: any) => u.living_surface);
      return `<div style="color:#0E1A24"><b>${t}</b><span class="small">${NAMES[t] ?? ''}</span><img src="file://${root}public/plans/${t.toLowerCase()}.svg"><p class="small" style="margin:2mm 0 0">${Math.min(...s)} à ${m2(Math.max(...s))}<br>${av.length ? `${av.length} disponible${av.length > 1 ? 's' : ''}` : 'Plus de disponibilité'}</p></div>`;
    }).join('')}</div>
    <p class="small" style="color:#A8B1B7;margin-top:6mm">${avail.length} logements disponibles sur ${d.stats.units} au ${today}. Plans indicatifs et non contractuels.</p>${footer(d, 'Brochure', ++n + 1)}</section>
  ${place ? `<section class="page paper"><div class="cols"><div><img class="photo" src="${img(place, 1100, 1180)}"></div><div>
    <p class="eyebrow">Situation</p><h2>${esc(a.placeName)}</h2><p class="lead" style="margin-top:8mm">${esc(a.situation)}</p>
    <p class="small">${esc([d.address.street, `${d.address.postcode} ${d.address.city}`].join(', '))}</p></div></div>${footer(d, 'Brochure', ++n + 1)}</section>` : ''}
  <section class="page ink"><div class="cols"><div><p class="eyebrow">Contact</p><h2>Prendre rendez-vous</h2></div><div style="align-self:end">
    <dl class="facts">
      ${agent ? `<div><dt>Votre conseiller</dt><dd>${esc(agent.first_name)} ${esc(agent.last_name)}<br>${esc(agent.phone ?? '')}<br>${esc(agent.email ?? '')}</dd></div>` : ''}
      <div><dt>Arvel Promotion</dt><dd>${esc([team.address.street, `${team.address.postcode} ${team.address.city}`].join(', '))}<br>${esc(team.phone ?? '')}<br>${esc(team.email ?? '')}</dd></div>
    </dl></div></div>${footer(d, 'Brochure', ++n + 1)}</section>`;
}

function plans(d: any) {
  const types = [...new Set(d.units.map((u: any) => u.rooms))].sort() as number[];
  return types.map((r, i) => {
    const p = planFor(r)!;
    const us = d.units.filter((u: any) => u.rooms === r);
    const s = us.map((u: any) => u.living_surface);
    const svg = toSvg(planTree(p, { outdoor: { label: 'Balcon', surface: 10 }, caption: `Plan indicatif ${p.code}, environ ${Math.round(nominalSurface(p))} m², non contractuel` }));
    return `<section class="page paper"><div class="plan-page"><div style="background:#fff;padding:6mm">${svg}</div><div>
      <p class="eyebrow">${esc(d.title)}</p><h2>${p.code}<em>${NAMES[p.code]}</em></h2>
      <dl class="facts" style="margin-top:10mm"><div><dt>Logements</dt><dd>${us.length}</dd></div><div><dt>Surfaces</dt><dd>${Math.min(...s)} à ${m2(Math.max(...s))}</dd></div>
      <div><dt>Étages</dt><dd>${[...new Set(us.map(floor))].join(', ')}</dd></div></dl>
      <p class="small" style="margin-top:8mm">Plan type indicatif. Chaque logement a son propre plan (orientation, surfaces) sur sa page du site et sur demande.</p>
    </div></div>${footer(d, 'Plans types', i + 1)}</section>`;
  }).join('');
}

function prices(d: any) {
  const units = [...d.units].sort((a: any, b: any) => (a.floor - b.floor) || ((fx.fixture_only.units[a.id]?.position ?? 0) - (fx.fixture_only.units[b.id]?.position ?? 0)));
  const rows = units.map((u: any) => {
    const x = fx.fixture_only.units[u.id] ?? {};
    const out = x.terrace_surface ?? u.balcony_surface;
    const price = u.status === 'available' ? (u.price && !u.price_on_request ? eur(u.price) : 'Prix sur demande') : '';
    return `<tr class="${u.status}"><td>${esc(x.unit_number ?? '')}</td><td>T${u.rooms}</td><td>${esc(floor(u))}</td><td class="r">${m2(u.living_surface)}</td><td class="r">${out ? `${m2(out)} ${x.terrace_surface ? 'terrasse' : 'balcon'}` : ''}</td><td>${ORIENT[x.orientation] ?? ''}</td><td>${STATUS[u.status]}</td><td class="r">${price}</td></tr>`;
  });
  const per = 13;
  const pages = [];
  for (let i = 0; i < rows.length; i += per) pages.push(rows.slice(i, i + per));
  return pages.map((chunk, i) => `<section class="page paper">
    <p class="eyebrow">${esc(d.title)} · ${esc(d.address.city)}</p><h2 style="font-size:28pt">Grille des prix au ${today}</h2>
    <table style="margin-top:8mm"><thead><tr><th>Lot</th><th>Type</th><th>Étage</th><th class="r">Surface</th><th class="r">Extérieur</th><th>Orientation</th><th>Statut</th><th class="r">Prix</th></tr></thead><tbody>${chunk.join('')}</tbody></table>
    <p class="small" style="margin-top:5mm">Prix à la date indiquée, sous réserve de disponibilité. Les logements réservés ou vendus n’affichent pas de prix.</p>
    ${footer(d, 'Grille des prix', i + 1)}</section>`).join('');
}

const browser = await chromium.launch();
const tmp = mkdtempSync(join(tmpdir(), 'arvel-docs-'));
const manifest: Record<string, unknown[]> = {};
for (const d of fx.developments) {
  const docs = [
    { kind: 'brochure', file: `${d.slug}-brochure.pdf`, title: 'Brochure', description: `Le programme, ses typologies, sa situation et vos contacts.`, html: brochure(d) },
    { kind: 'plans', file: `${d.slug}-plans-types.pdf`, title: 'Plans types', description: `Un plan indicatif par typologie, du T${d.stats.rooms.min} au T${d.stats.rooms.max}.`, html: plans(d) },
    { kind: 'prices', file: `${d.slug}-grille-des-prix.pdf`, title: 'Grille des prix', description: `Tous les logements avec leur surface, leur étage, leur statut et le prix des logements disponibles.`, html: prices(d) },
  ];
  manifest[d.slug] = [];
  for (const doc of docs) {
    const file = join(tmp, `${doc.file}.html`);
    writeFileSync(file, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(d.title)} · ${doc.title}</title><style>${css}</style></head><body>${doc.html}</body></html>`);
    const page = await browser.newPage();
    await page.goto(`file://${file}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const out = join(outDir, doc.file);
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
    await page.close();
    const pages = (readFileSync(out, 'latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    manifest[d.slug]!.push({ href: `/documents/${doc.file}`, title: doc.title, description: doc.description, kind: doc.kind, bytes: statSync(out).size, pages, date: TODAY });
    console.log(`public/documents/${doc.file}  ${pages} p.  ${Math.round(statSync(out).size / 1000)} KB`);
  }
}
await browser.close();
writeFileSync(join(root, 'src/content/documents.json'), `${JSON.stringify(manifest, null, 1)}\n`);
void PLANS;
