#!/usr/bin/env node
/**
 * Generates the development's PDFs into public/documents/<lang>/ from our own
 * HTML with Playwright (page.pdf): brochure, price list, plans, in Italian and
 * German. The API has no documents yet (fixture only); figures come from
 * src/data/fixture.json, the plans from public/plans/ (run `pnpm plans`
 * first), photos through imgproxy. Writes src/content/documents.json.
 * Run: pnpm documents
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const fx = JSON.parse(readFileSync('src/data/fixture.json', 'utf8'));
const dev = fx.developments[0];
const org = fx.organisation;
const team = fx.teams.find((t) => t.primary) ?? fx.teams[0];
const extra = fx.fixture_only.developments[dev.id] ?? {}; // fixture only
const ux = (u) => fx.fixture_only.units[u.id] ?? {}; // fixture only
const agent = dev.agents[0];

const b64 = (s) => Buffer.from(s).toString('base64url');
const photo = (url, w, h) => `https://img.realadvisor.ch/_/rs:fill:${w}:${h}:1:0/q:70/${b64(url)}.jpg`;
const chf = (n) => `CHF ${new Intl.NumberFormat('de-CH').format(n)}`;
const m2 = (n) => (n ? `${n} m²` : '–');
const units = [...dev.units].sort((a, b) => (ux(a).building ?? '').localeCompare(ux(b).building ?? '') || a.floor - b.floor || (ux(a).position ?? 0) - (ux(b).position ?? 0));
const topOf = (u) => Math.max(...units.filter((x) => ux(x).building === ux(u).building).map((x) => x.floor));
const pent = (u) => u.floor > 0 && u.floor === topOf(u);
const planKey = (u) => {
  const k = String(u.rooms).replace('.', '');
  if (pent(u)) return `attico-${k}`;
  return u.floor === 0 ? `${k}-giardino` : k;
};
const svg = (l, k) => readFileSync(`public/plans/${l}/plan-${k}.svg`, 'utf8').replace(/width="\d+" height="\d+"/, 'width="100%"');
const today = new Date().toISOString().slice(0, 10);

const L = {
  it: {
    loc: 'it-CH', rooms: (r) => `${r} locali`, house: (b) => `Casa ${b}`, pent: 'Attico',
    floor: (u) => (pent(u) ? 'Attico' : u.floor === 0 ? 'Piano terra' : `${u.floor}° piano`),
    status: { available: 'Disponibile', reserved: 'Riservato', sold: 'Venduto' },
    out: (u) => (ux(u).garden_surface ? `Giardino ${ux(u).garden_surface} m²` : ux(u).terrace_surface ? `Terrazza ${ux(u).terrace_surface} m²` : u.balcony_surface ? `Loggia ${u.balcony_surface} m²` : '–'),
    desc: dev.description_text.split('\n\n'),
    sub: (d) => `Appartamenti nuovi a Castagnola, Lugano · Consegna prevista ${d}`,
    projectEy: 'Il progetto', projectH: 'Due case sul pendio, davanti al lago.',
    fig: ['appartamenti', 'locali', 'm² abitabili', 'consegna prevista'],
    typesEy: 'Tipologie', typesH: (a, b) => `Dal ${a} al ${b} locali.`,
    th: ['Tipo', 'Superfici', 'Unità', 'Disponibili', 'Prezzo'],
    fromP: 'da', pricesAt: (d) => `Prezzi degli appartamenti disponibili al ${d}. Per gli appartamenti riservati e venduti il prezzo non è pubblicato.`,
    sampleNote: 'Esempio: 3.5 locali, piani 1 e 2. Pianta indicativa, non vincolante.',
    creditsEy: 'Committente e contatti', salesH: 'Ufficio vendite', credits: ['Committente', 'Architettura', 'Impresa generale'],
    sales: 'Vendita', contact: 'Il vostro contatto',
    disclaimer: 'Documento non vincolante. Immagini, piante e superfici indicative, soggette a modifiche.',
    priceEy: (d) => `Listino prezzi · al ${d}`,
    priceSub: (n, a, d) => `${n} appartamenti · ${a} disponibili · consegna prevista ${d}`,
    priceTh: ['N.', 'Casa', 'Piano', 'Locali', 'Superficie', 'Esterno', 'Prezzo', 'Stato'],
    priceNote: 'Prezzi di vendita in CHF, posto auto e cantina compresi secondo la descrizione. Listino non vincolante, salvo venduto.',
    plansEy: 'Piante', withGarden: 'con giardino', units: 'Appartamenti',
    planNote: 'Pianta indicativa, non vincolante. Tutte le piante alla stessa scala. Superfici di vendita secondo il listino.',
    docs: [
      ['brochure', 'brochure-archi-del-bre.pdf', 'Brochure', 'Il progetto, le tipologie, chi costruisce e l’ufficio vendite.'],
      ['prices', 'listino-prezzi-archi-del-bre.pdf', 'Listino prezzi', 'Tutti gli appartamenti con superfici, piano, prezzo e disponibilità.'],
      ['plans', 'piante-archi-del-bre.pdf', 'Piante', 'Una pianta indicativa per tipologia, alla stessa scala.'],
    ],
  },
  de: {
    loc: 'de-CH', rooms: (r) => `${r} Zimmer`, house: (b) => `Haus ${b}`, pent: 'Attika',
    floor: (u) => (pent(u) ? 'Attika' : u.floor === 0 ? 'Erdgeschoss' : `${u.floor}. Obergeschoss`),
    status: { available: 'Verfügbar', reserved: 'Reserviert', sold: 'Verkauft' },
    out: (u) => (ux(u).garden_surface ? `Garten ${ux(u).garden_surface} m²` : ux(u).terrace_surface ? `Terrasse ${ux(u).terrace_surface} m²` : u.balcony_surface ? `Loggia ${u.balcony_surface} m²` : '–'),
    desc: JSON.parse(readFileSync('src/content/description-de.json', 'utf8')),
    sub: (d) => `Neubauwohnungen in Castagnola, Lugano · Bezug geplant ${d}`,
    projectEy: 'Das Projekt', projectH: 'Zwei Häuser am Hang, vor dem See.',
    fig: ['Wohnungen', 'Zimmer', 'm² Wohnfläche', 'Bezug geplant'],
    typesEy: 'Wohnungstypen', typesH: (a, b) => `Von ${a} bis ${b} Zimmer.`,
    th: ['Typ', 'Flächen', 'Wohnungen', 'Verfügbar', 'Preis'],
    fromP: 'ab', pricesAt: (d) => `Preise der verfügbaren Wohnungen, Stand ${d}. Für reservierte und verkaufte Wohnungen wird kein Preis veröffentlicht.`,
    sampleNote: 'Beispiel: 3.5 Zimmer, 1. und 2. Obergeschoss. Indikativer Grundriss, unverbindlich.',
    creditsEy: 'Bauherrschaft und Kontakt', salesH: 'Verkaufsbüro', credits: ['Bauherrschaft', 'Architektur', 'Generalunternehmung'],
    sales: 'Verkauf', contact: 'Ihre Ansprechperson',
    disclaimer: 'Unverbindliches Dokument. Bilder, Grundrisse und Flächen indikativ, Änderungen vorbehalten.',
    priceEy: (d) => `Preisliste · Stand ${d}`,
    priceSub: (n, a, d) => `${n} Wohnungen · ${a} verfügbar · Bezug geplant ${d}`,
    priceTh: ['Nr.', 'Haus', 'Etage', 'Zimmer', 'Fläche', 'Aussen', 'Preis', 'Status'],
    priceNote: 'Verkaufspreise in CHF, Parkplatz und Keller gemäss Beschrieb inbegriffen. Unverbindliche Preisliste, Zwischenverkauf vorbehalten.',
    plansEy: 'Grundrisse', withGarden: 'mit Garten', units: 'Wohnungen',
    planNote: 'Indikativer Grundriss, unverbindlich. Alle Grundrisse im gleichen Massstab. Verkaufsflächen gemäss Preisliste.',
    docs: [
      ['brochure', 'broschuere-archi-del-bre.pdf', 'Broschüre', 'Das Projekt, die Wohnungstypen, wer baut und das Verkaufsbüro.'],
      ['prices', 'preisliste-archi-del-bre.pdf', 'Preisliste', 'Alle Wohnungen mit Flächen, Etage, Preis und Verfügbarkeit.'],
      ['plans', 'grundrisse-archi-del-bre.pdf', 'Grundrisse', 'Ein indikativer Grundriss pro Wohnungstyp, im gleichen Massstab.'],
    ],
  },
};

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #2a251f; background: #fff; }
.page { width: 210mm; height: 297mm; padding: 18mm 18mm 16mm; position: relative; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
.sans { font-family: Helvetica, Arial, sans-serif; }
.eyebrow { font: 600 8pt/1 Helvetica, Arial, sans-serif; color: #6d5236; }
h1 { font-weight: 400; font-size: 40pt; line-height: 1; margin: 6mm 0 4mm; }
h2 { font-weight: 400; font-size: 22pt; line-height: 1.1; margin: 4mm 0 6mm; }
p { font-size: 10.5pt; line-height: 1.6; margin: 0 0 3mm; }
.foot { position: absolute; left: 18mm; right: 18mm; bottom: 10mm; display: flex; justify-content: space-between; gap: 6mm; font: 7pt/1.4 Helvetica, Arial, sans-serif; color: #675d51; border-top: 0.3mm solid #ddd3c3; padding-top: 3mm; }
table { width: 100%; border-collapse: collapse; font: 8.5pt/1.3 Helvetica, Arial, sans-serif; }
th { text-align: left; font-weight: 600; font-size: 7pt; color: #675d51; padding: 2.4mm 1.6mm; border-bottom: 0.4mm solid #b9ac98; }
td { padding: 2.3mm 1.6mm; border-bottom: 0.2mm solid #e8dfd2; }
tr.group td { font: 400 12pt/1 Georgia, serif; padding-top: 5mm; border-bottom: 0.4mm solid #b9ac98; }
.r { text-align: right; }
tr.sold td { color: #8a7f71; }
.fig { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 0.3mm solid #ddd3c3; border-bottom: 0.3mm solid #ddd3c3; margin: 6mm 0; }
.fig div { padding: 5mm 3mm; border-left: 0.3mm solid #ddd3c3; }
.fig div:first-child { border-left: 0; padding-left: 0; }
.fig b { display: block; font-weight: 400; font-size: 20pt; line-height: 1; margin-bottom: 2mm; }
.fig span { font: 600 7pt/1.4 Helvetica, Arial, sans-serif; color: #675d51; }
img.ph { display: block; width: 100%; object-fit: cover; border-radius: 3mm; }
`;

function build(l) {
  const t = L[l];
  const delivery = new Intl.DateTimeFormat(t.loc, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(dev.delivery_date));
  const todayL = new Intl.DateTimeFormat(t.loc, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(today));
  const rooms = [...new Set(units.map((u) => u.rooms))].sort((a, b) => a - b);
  const surfaces = units.map((u) => u.living_surface);
  const label = (u) => `${t.rooms(u.rooms)}, ${t.floor(u)}, ${t.house(ux(u).building)}`;
  const footer = (n) => `<div class="foot"><span>${dev.title} · ${dev.address.street}, ${dev.address.postcode} ${dev.address.city}</span><span>${org.name} · ${team.phone} · ${team.email}</span><span>${n}</span></div>`;

  const brochure = () => {
    const [p0, p1, p2, p3, p4] = dev.photos;
    const types = [...new Set(units.map((u) => `${u.rooms}${pent(u) ? 'p' : ''}`))].map((k) => {
      const us = units.filter((u) => `${u.rooms}${pent(u) ? 'p' : ''}` === k);
      const av = us.filter((u) => u.status === 'available' && u.price);
      const s = us.map((u) => u.living_surface);
      const name = `${k.endsWith('p') ? `${t.pent} ` : ''}${t.rooms(us[0].rooms)}`;
      return { k, rooms: us[0].rooms, p: k.endsWith('p'), row: `<tr><td>${name}</td><td class="r">${Math.min(...s) === Math.max(...s) ? m2(s[0]) : `${Math.min(...s)}–${m2(Math.max(...s))}`}</td><td class="r">${us.length}</td><td class="r">${av.length}</td><td class="r">${av.length ? `${t.fromP} ${chf(Math.min(...av.map((u) => u.price)))}` : '–'}</td></tr>` };
    }).sort((a, b) => Number(a.p) - Number(b.p) || a.rooms - b.rooms).map((x) => x.row).join('');
    const credits = t.credits.map((k, i) => [k, [extra.developer, extra.architect, extra.general_contractor][i]]).filter((c) => c[1]);
    return `
<section class="page" style="padding:0;background:#f6f1e8">
  <div style="padding:12mm 12mm 0"><img class="ph" src="${photo(p0.url, 1300, 1150)}" style="height:196mm;border-radius:6mm"></div>
  <div style="padding:12mm 18mm">
    <p class="eyebrow">Castagnola · Lugano</p>
    <h1 style="font-size:46pt">${dev.title}</h1>
    <p style="font-size:14pt;color:#675d51">${t.sub(delivery)}</p>
  </div>
</section>
<section class="page">
  <p class="eyebrow">${t.projectEy}</p>
  <h2>${t.projectH}</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm">
    <div>${t.desc.map((p) => `<p>${p}</p>`).join('')}</div>
    <img class="ph" src="${photo(p1.url, 700, 900)}" style="height:104mm;border-radius:40mm 40mm 3mm 3mm">
  </div>
  <div class="fig">
    <div><b>${units.length}</b><span>${t.fig[0]}</span></div>
    <div><b>${rooms[0]}–${rooms[rooms.length - 1]}</b><span>${t.fig[1]}</span></div>
    <div><b>${Math.min(...surfaces)}–${Math.max(...surfaces)}</b><span>${t.fig[2]}</span></div>
    <div><b style="font-size:15pt;line-height:1.35">${delivery}</b><span>${t.fig[3]}</span></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm">
    ${[p2, p3, p4].map((p) => `<img class="ph" src="${photo(p.url, 600, 700)}" style="height:60mm">`).join('')}
  </div>
  ${footer(2)}
</section>
<section class="page">
  <p class="eyebrow">${t.typesEy}</p>
  <h2>${t.typesH(rooms[0], rooms[rooms.length - 1])}</h2>
  <table><thead><tr>${t.th.map((h, i) => `<th${i ? ' class="r"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${types}</tbody></table>
  <p class="sans" style="font-size:7.5pt;color:#675d51;margin-top:3mm">${t.pricesAt(todayL)}</p>
  <div style="margin-top:8mm;border:0.3mm solid #ddd3c3;border-radius:3mm;overflow:hidden">${svg(l, '35')}</div>
  <p class="sans" style="font-size:7.5pt;color:#675d51;margin-top:2mm">${t.sampleNote}</p>
  ${footer(3)}
</section>
<section class="page">
  <p class="eyebrow">${t.creditsEy}</p>
  <h2>${t.salesH}</h2>
  ${credits.map(([k, v]) => `<p class="sans" style="font-size:9pt;margin:0 0 1mm;color:#675d51">${k}</p><p style="font-size:14pt;margin-bottom:5mm">${v}</p>`).join('')}
  <div style="margin-top:10mm;padding-top:8mm;border-top:0.3mm solid #ddd3c3">
    <p class="sans" style="font-size:9pt;color:#675d51;margin-bottom:1mm">${t.sales}</p>
    <p style="font-size:14pt;margin-bottom:1mm">${team.name}</p>
    <p>${team.address.street}, ${team.address.postcode} ${team.address.city}<br>${team.phone} · ${team.email}</p>
    ${agent ? `<p style="margin-top:5mm">${t.contact}: ${agent.first_name} ${agent.last_name}<br>${agent.phone} · ${agent.email}</p>` : ''}
  </div>
  <p class="sans" style="position:absolute;bottom:22mm;left:18mm;right:18mm;font-size:7pt;color:#8a7f71">${t.disclaimer}</p>
  ${footer(4)}
</section>`;
  };

  const priceList = () => {
    let last = '';
    const rows = units.map((u) => {
      const b = ux(u).building;
      const head = b !== last ? `<tr class="group"><td colspan="8">${t.house(b)}</td></tr>` : '';
      last = b;
      return `${head}<tr class="${u.status}"><td>${ux(u).unit_number ?? '–'}</td><td>${b}</td><td>${t.floor(u)}</td><td>${t.rooms(u.rooms)}</td><td class="r">${m2(u.living_surface)}</td><td>${t.out(u)}</td><td class="r">${u.status === 'available' && u.price ? chf(u.price) : '–'}</td><td>${t.status[u.status]}</td></tr>`;
    }).join('');
    return `<section class="page">
  <p class="eyebrow">${t.priceEy(todayL)}</p>
  <h1 style="font-size:30pt">${dev.title}</h1>
  <p class="sans" style="font-size:9pt;color:#675d51;margin-bottom:4mm">${t.priceSub(units.length, units.filter((u) => u.status === 'available').length, delivery)}</p>
  <table><thead><tr>${t.priceTh.map((h, i) => `<th${i === 4 || i === 6 ? ' class="r"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
  <p class="sans" style="font-size:7.5pt;color:#675d51;margin-top:4mm">${t.priceNote}</p>
  ${footer(1)}
</section>`;
  };

  const plans = () => {
    const seen = new Map();
    for (const u of units) if (!seen.has(planKey(u))) seen.set(planKey(u), u);
    const list = [...seen.entries()].sort((a, b) => Number(pent(a[1])) - Number(pent(b[1])) || a[1].rooms - b[1].rooms || a[1].floor - b[1].floor);
    return list.map(([k, u], i) => {
      const lots = units.filter((x) => planKey(x) === k).map((x) => ux(x).unit_number).filter(Boolean);
      return `<section class="page">
  <p class="eyebrow">${t.plansEy} · ${i + 1} / ${list.length}</p>
  <h2>${pent(u) ? `${t.pent} ` : ''}${t.rooms(u.rooms)}${u.floor === 0 ? `, ${t.withGarden}` : ''}</h2>
  <p class="sans" style="font-size:9pt;color:#675d51">${lots.length ? `${t.units}: ${lots.join(', ')}` : ''}</p>
  <div style="margin-top:8mm;border:0.3mm solid #ddd3c3;border-radius:3mm;overflow:hidden">${svg(l, k)}</div>
  <p class="sans" style="font-size:7.5pt;color:#675d51;margin-top:3mm">${t.planNote}</p>
  ${footer(i + 1)}
</section>`;
    }).join('');
  };
  void label;
  return { brochure, prices: priceList, plans };
}

const browser = await chromium.launch();
const page = await browser.newPage();
const files = {};
for (const l of ['it', 'de']) {
  mkdirSync(`public/documents/${l}`, { recursive: true });
  const html = build(l);
  files[l] = [];
  for (const [key, file, title, description] of L[l].docs) {
    await page.setContent(`<!doctype html><html lang="${L[l].loc}"><head><meta charset="utf-8"><title>${title} · ${dev.title}</title><style>${CSS}</style></head><body>${html[key]()}</body></html>`, { waitUntil: 'networkidle' });
    const path = `public/documents/${l}/${file}`;
    await page.pdf({ path, format: 'A4', printBackground: true, preferCSSPageSize: true });
    const pdf = readFileSync(path, 'latin1');
    const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    files[l].push({ key, href: `/documents/${l}/${file}`, title, description, pages, bytes: statSync(path).size });
  }
}
await browser.close();
writeFileSync('src/content/documents.json', `${JSON.stringify({ updated: today, files }, null, 2)}\n`);
console.log(Object.values(files).flat().map((d) => `${d.href} ${d.pages}p ${Math.round(d.bytes / 1024)} KB`).join('\n'));
