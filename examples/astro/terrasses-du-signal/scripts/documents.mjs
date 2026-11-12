#!/usr/bin/env node
/**
 * Generates the development's PDFs into public/documents/ from our own HTML
 * with Playwright (page.pdf): brochure, price list, plans. The API has no
 * documents yet (fixture only); figures come from src/data/fixture.json, the
 * plans from public/plans/ (run `pnpm plans` first). Writes
 * src/content/documents.json (titles, sizes, pages) for the Documents page.
 * Run: pnpm documents
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const fx = JSON.parse(readFileSync('src/data/fixture.json', 'utf8'));
const dev = fx.developments[0];
const org = fx.organisation;
const team = fx.teams.find((t) => t.primary) ?? fx.teams[0];
const ux = (u) => fx.fixture_only.units[u.id] ?? {}; // fixture only
const agent = dev.agents[0];

const b64 = (s) => Buffer.from(s).toString('base64url');
const photo = (url, w, h) => `https://img.realadvisor.ch/_/rs:fill:${w}:${h}:1:0/q:68/${b64(url)}.jpg`;
const chf = (n) => `CHF ${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’')}`;
const m2 = (n) => (n ? `${n} m²` : '–');
const floor = (u) => u.floor_label ?? (u.floor === 0 ? 'Rez-de-chaussée' : `${u.floor}e étage`);
const status = { available: 'Disponible', reserved: 'Réservé', sold: 'Vendu' };
const units = [...dev.units].sort((a, b) => a.floor - b.floor || (ux(a).position ?? 0) - (ux(b).position ?? 0));
const outdoor = (u) => u.garden_surface ?? u.balcony_surface ?? u.terrace_surface;
const top = Math.max(...units.map((u) => u.floor));
const planFile = (u) => {
  const k = String(u.rooms).replace('.', '');
  if (u.floor === top && (u.rooms === 5.5 || u.rooms === 6.5)) return `plan-${k}-attique.svg`;
  return u.floor === 0 ? `plan-${k}-jardin.svg` : `plan-${k}.svg`;
};
const svg = (f) => readFileSync(`public/plans/${f}`, 'utf8').replace(/width="\d+" height="\d+"/, 'width="100%"');
const delivery = new Intl.DateTimeFormat('fr-CH', { month: 'long', year: 'numeric' }).format(new Date(dev.delivery_date));
const today = new Date().toISOString().slice(0, 10);
const todayFr = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(today));
const rooms = [...new Set(units.map((u) => u.rooms))].sort((a, b) => a - b);
const surfaces = units.map((u) => u.living_surface);

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #26211b; background: #fff; }
.page { width: 210mm; height: 297mm; padding: 18mm 18mm 16mm; position: relative; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
.sans { font-family: Helvetica, Arial, sans-serif; }
.eyebrow { font: 600 7.5pt/1 Helvetica, Arial, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; color: #655b4f; }
h1 { font-weight: 400; font-size: 40pt; line-height: 1; margin: 6mm 0 4mm; }
h2 { font-weight: 400; font-size: 22pt; line-height: 1.1; margin: 4mm 0 6mm; }
p { font-size: 10.5pt; line-height: 1.6; margin: 0 0 3mm; }
.foot { position: absolute; left: 18mm; right: 18mm; bottom: 10mm; display: flex; justify-content: space-between; font: 7pt/1.4 Helvetica, Arial, sans-serif; color: #655b4f; border-top: 0.3mm solid #ddd4c6; padding-top: 3mm; }
table { width: 100%; border-collapse: collapse; font: 8.5pt/1.3 Helvetica, Arial, sans-serif; }
th { text-align: left; font-weight: 600; font-size: 6.5pt; letter-spacing: 0.14em; text-transform: uppercase; color: #655b4f; padding: 2.4mm 2mm; border-bottom: 0.4mm solid #c4b8a6; }
td { padding: 2.6mm 2mm; border-bottom: 0.2mm solid #e5ddd0; }
.r { text-align: right; }
tr.sold td, tr.reserved td.p { color: #8a7f71; }
.fig { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 0.3mm solid #ddd4c6; border-bottom: 0.3mm solid #ddd4c6; margin: 6mm 0; }
.fig div { padding: 5mm 3mm; border-left: 0.3mm solid #ddd4c6; }
.fig div:first-child { border-left: 0; padding-left: 0; }
.fig b { display: block; font-weight: 400; font-size: 20pt; line-height: 1; }
.fig span { font: 600 6.5pt/1.4 Helvetica, Arial, sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: #655b4f; }
`;

const footer = (n) => `<div class="foot"><span>${dev.title} · ${dev.address.street}, ${dev.address.postcode} ${dev.address.city}</span><span>${org.name} · ${team.phone} · ${team.email}</span><span>${n}</span></div>`;

function brochure() {
  const [p0, p1, p2, p3, p4] = dev.photos;
  const desc = dev.description_text.split('\n\n').map((p) => `<p>${p}</p>`).join('');
  const types = rooms.map((r) => {
    const us = units.filter((u) => u.rooms === r);
    const av = us.filter((u) => u.status === 'available' && u.price);
    const s = us.map((u) => u.living_surface);
    return `<tr><td>${String(r)} pièces</td><td class="r">${Math.min(...s) === Math.max(...s) ? m2(s[0]) : `${Math.min(...s)}–${m2(Math.max(...s))}`}</td><td class="r">${us.length}</td><td class="r">${av.length}</td><td class="r">${av.length ? `dès ${chf(Math.min(...av.map((u) => u.price)))}` : '–'}</td></tr>`;
  }).join('');
  const credits = [['Maître d’ouvrage', dev.developer?.name], ['Architecte', dev.architect?.name], ['Entreprise générale', dev.general_contractor?.name]].filter((c) => c[1]);
  return `
<section class="page" style="padding:0;background:#2b261f;color:#f3eee6">
  <img src="${photo(p0.url, 1100, 1000)}" style="width:100%;height:210mm;object-fit:cover;display:block">
  <div style="padding:14mm 18mm">
    <p class="eyebrow" style="color:#cbc1b2">${dev.address.city} · Lavaux</p>
    <h1 style="font-size:48pt">${dev.title}</h1>
    <p style="font-style:italic;font-size:15pt;color:#cbc1b2">Appartements neufs face au Léman · Livraison ${delivery}</p>
  </div>
</section>
<section class="page">
  <p class="eyebrow">Le projet</p>
  <h2>Posé dans la pente, tourné vers le lac.</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm">
    <div>${desc}</div>
    <img src="${photo(p1.url, 700, 860)}" style="width:100%;height:96mm;object-fit:cover">
  </div>
  <div class="fig">
    <div><b>${units.length}</b><span>appartements</span></div>
    <div><b>${rooms[0]} à ${rooms[rooms.length - 1]}</b><span>pièces</span></div>
    <div><b>${Math.min(...surfaces)} à ${Math.max(...surfaces)}</b><span>m² habitables</span></div>
    <div><b style="font-size:15pt;line-height:1.35">${delivery}</b><span>livraison prévue</span></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm">
    ${[p2, p3, p4].map((p) => `<img src="${photo(p.url, 600, 700)}" style="width:100%;height:62mm;object-fit:cover">`).join('')}
  </div>
  ${footer(2)}
</section>
<section class="page">
  <p class="eyebrow">Typologies</p>
  <h2>Du ${rooms[0]} au ${rooms[rooms.length - 1]} pièces.</h2>
  <table><thead><tr><th>Type</th><th class="r">Surfaces</th><th class="r">Lots</th><th class="r">Disponibles</th><th class="r">Prix</th></tr></thead><tbody>${types}</tbody></table>
  <p class="sans" style="font-size:7.5pt;color:#655b4f;margin-top:3mm">Prix des lots disponibles au ${todayFr}. Les lots réservés et vendus ne sont pas chiffrés.</p>
  <div style="margin-top:10mm;border:0.3mm solid #ddd4c6">${svg('plan-45.svg')}</div>
  <p class="sans" style="font-size:7.5pt;color:#655b4f;margin-top:2mm">Exemple : 4.5 pièces, étages 1 à 4. Plan indicatif, non contractuel.</p>
  ${footer(3)}
</section>
<section class="page">
  <p class="eyebrow">Intervenants et contact</p>
  <h2>Espace de vente</h2>
  ${credits.map(([k, v]) => `<p class="sans" style="font-size:9pt;margin:0 0 1mm;color:#655b4f">${k}</p><p style="font-size:14pt;margin-bottom:5mm">${v}</p>`).join('')}
  <div style="margin-top:10mm;padding-top:8mm;border-top:0.3mm solid #ddd4c6">
    <p class="sans" style="font-size:9pt;color:#655b4f;margin-bottom:1mm">Commercialisation</p>
    <p style="font-size:14pt;margin-bottom:1mm">${org.name}</p>
    <p>${org.address.street}, ${org.address.postcode} ${org.address.city}<br>${team.phone} · ${team.email}</p>
    ${agent ? `<p style="margin-top:5mm">Votre contact : ${agent.first_name} ${agent.last_name}<br>${agent.phone} · ${agent.email}</p>` : ''}
  </div>
  <p class="sans" style="position:absolute;bottom:22mm;left:18mm;right:18mm;font-size:7pt;color:#8a7f71">Document non contractuel. Visuels, plans et surfaces indicatifs, susceptibles d’évoluer.</p>
  ${footer(4)}
</section>`;
}

function priceList() {
  const rows = units.map((u) => `<tr class="${u.status}"><td>${u.reference ?? '–'}</td><td>${String(u.rooms)} pièces</td><td>${floor(u)}</td><td class="r">${m2(u.living_surface)}</td><td class="r">${m2(outdoor(u))}</td><td class="r p">${u.status === 'available' && u.price ? chf(u.price) : '–'}</td><td>${status[u.status]}</td></tr>`).join('');
  return `<section class="page">
  <p class="eyebrow">Liste de prix · au ${todayFr}</p>
  <h1 style="font-size:30pt">${dev.title}</h1>
  <p class="sans" style="font-size:9pt;color:#655b4f;margin-bottom:6mm">${units.length} lots · ${units.filter((u) => u.status === 'available').length} disponibles · livraison prévue ${delivery}</p>
  <table><thead><tr><th>Lot</th><th>Type</th><th>Étage</th><th class="r">Surface</th><th class="r">Extérieur</th><th class="r">Prix</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="sans" style="font-size:7.5pt;color:#655b4f;margin-top:4mm">Prix de vente en CHF, places de parc comprises selon le descriptif. Les prix des lots réservés et vendus ne sont pas publiés. Liste non contractuelle, sous réserve de vente.</p>
  ${footer(1)}
</section>`;
}

function plans() {
  const seen = new Map();
  for (const u of units) if (!seen.has(planFile(u))) seen.set(planFile(u), u);
  return [...seen.entries()].sort((a, b) => a[1].rooms - b[1].rooms).map(([f, u], i) => {
    const lots = units.filter((x) => planFile(x) === f).map((x) => x.reference).filter(Boolean);
    return `<section class="page">
  <p class="eyebrow">Plans · ${i + 1} / ${seen.size}</p>
  <h2>${String(u.rooms)} pièces${f.includes('attique') ? ', attique' : f.includes('jardin') ? ', rez-de-jardin' : ''}</h2>
  <p class="sans" style="font-size:9pt;color:#655b4f">${lots.length ? `Lots ${lots.join(', ')}` : ''}</p>
  <div style="margin-top:8mm;border:0.3mm solid #ddd4c6">${svg(f)}</div>
  <p class="sans" style="font-size:7.5pt;color:#655b4f;margin-top:3mm">Plan indicatif, non contractuel. Tous les plans à la même échelle. Surfaces de vente selon la liste de prix.</p>
  ${footer(i + 1)}
</section>`;
  }).join('');
}

const DOCS = [
  { file: 'brochure-terrasses-du-signal.pdf', title: 'Brochure', description: 'Le projet, les typologies, les intervenants et l’espace de vente.', html: brochure },
  { file: 'liste-de-prix-terrasses-du-signal.pdf', title: 'Liste de prix', description: 'Tous les lots avec surfaces, étage, prix et disponibilité.', html: priceList },
  { file: 'plans-terrasses-du-signal.pdf', title: 'Plans', description: 'Un plan indicatif par typologie, à la même échelle.', html: plans },
];

mkdirSync('public/documents', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const out = [];
for (const d of DOCS) {
  await page.setContent(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${d.title} · ${dev.title}</title><style>${CSS}</style></head><body>${d.html()}</body></html>`, { waitUntil: 'networkidle' });
  const path = `public/documents/${d.file}`;
  await page.pdf({ path, format: 'A4', printBackground: true, preferCSSPageSize: true });
  const pdf = readFileSync(path, 'latin1');
  const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  out.push({ href: `/documents/${d.file}`, title: d.title, description: d.description, pages, bytes: statSync(path).size });
}
await browser.close();
writeFileSync('src/content/documents.json', `${JSON.stringify({ updated: today, files: out }, null, 2)}\n`);
console.log(out.map((d) => `${d.href} ${d.pages}p ${Math.round(d.bytes / 1024)} KB`).join('\n'));
