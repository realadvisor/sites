#!/usr/bin/env node
/**
 * Generates the development's PDFs into public/documents/ from our own HTML
 * with Playwright (page.pdf), in Spanish and English: dossier, price list,
 * plans. The API has no documents (fixture only); every figure comes from
 * src/data/fixture.json, the plans from public/plans/ (run `pnpm plans`
 * first). Writes src/content/documents.json for the Documents page.
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
const photo = (url, w, h) => `https://img.realadvisor.ch/_/rs:fill:${w}:${h}:1:0/q:70/${b64(url)}.jpg`;
const eur = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' }).format(n);
const m2 = (n) => (n ? `${n} m²` : '–');
const wingOf = (u) => (/ala nueva\s*$/i.test(u.name.trim()) ? 'nueva' : '1908');
const kindOf = (u) => (u.property_type.startsWith('apartment_penthouse') ? 'atico' : u.property_type === 'apartment_studio' || u.bedrooms === 0 ? 'estudio' : `${Math.min(4, u.bedrooms)}d`);
const planKey = (u) => (kindOf(u) === 'atico' ? `${wingOf(u)}-atico-${u.bedrooms}d` : kindOf(u) === 'estudio' && u.floor === 0 ? `${wingOf(u)}-estudio-patio` : `${wingOf(u)}-${kindOf(u)}`);
const outdoor = (u) => u.terrace_surface ?? u.balcony_surface;
const units = [...dev.units].sort((a, b) => (wingOf(a) === wingOf(b) ? 0 : wingOf(a) === '1908' ? -1 : 1) || a.floor - b.floor || (ux(a).position ?? 0) - (ux(b).position ?? 0));
const today = new Date().toISOString().slice(0, 10);

const T = {
  es: {
    locale: 'es-ES', wings: { '1908': 'Edificio 1908', nueva: 'Ala nueva' }, ground: 'Planta baja', floor: 'Planta',
    status: { available: 'Disponible', reserved: 'Reservada', sold: 'Vendida' },
    kinds: { estudio: 'Estudio', '1d': '1 dormitorio', '2d': '2 dormitorios', '3d': '3 dormitorios', '4d': '4 dormitorios', atico: 'Ático' },
    cover: 'Viviendas en Russafa, València', delivery: 'Entrega prevista', project: 'El proyecto', units: 'viviendas', available: 'disponibles',
    from: 'desde', sizes: 'interiores', types: 'Tipologías', type: 'Tipología', count: 'Viviendas', avail: 'Disponibles', price: 'Precio',
    priceNote: 'Precios de las viviendas disponibles a {d}. Las reservadas y vendidas no se publican.', credits: 'Intervenientes y ventas',
    developer: 'Promotora', architect: 'Arquitectura', contractor: 'Constructora', sales: 'Oficina de ventas', contact: 'Su contacto',
    disclaimer: 'Documento no contractual. Fotos de ambiente, planos y superficies indicativos, sujetos a cambios.',
    priceList: 'Lista de precios', at: 'a {d}', number: 'Nº', wing: 'Edificio', fl: 'Planta', interior: 'Interior', out: 'Exterior', st: 'Estado',
    listNote: 'Precios en euros. Lista no contractual, sujeta a disponibilidad.', plans: 'Planos', plan: 'Plano indicativo, no contractual. Todos los planos a la misma escala.',
    unitsOf: 'Viviendas {u}', dossier: 'Dossier', dossierD: 'El proyecto, los dos edificios, las tipologías y la oficina de ventas.',
    priceListD: 'Las 28 viviendas con superficies, planta, precio y disponibilidad.', plansD: 'Un plano indicativo por tipología y edificio.',
  },
  en: {
    locale: 'en-GB', wings: { '1908': '1908 building', nueva: 'New wing' }, ground: 'Ground floor', floor: 'Floor',
    status: { available: 'Available', reserved: 'Reserved', sold: 'Sold' },
    kinds: { estudio: 'Studio', '1d': '1 bedroom', '2d': '2 bedrooms', '3d': '3 bedrooms', '4d': '4 bedrooms', atico: 'Penthouse' },
    cover: 'Homes in Russafa, València', delivery: 'Completion', project: 'The project', units: 'homes', available: 'available',
    from: 'from', sizes: 'interior', types: 'Home types', type: 'Type', count: 'Homes', avail: 'Available', price: 'Price',
    priceNote: 'Prices of available homes as of {d}. Reserved and sold homes are not published.', credits: 'Team and sales',
    developer: 'Developer', architect: 'Architects', contractor: 'Contractor', sales: 'Sales office', contact: 'Your contact',
    disclaimer: 'Not a contractual document. Mood photos, plans and areas are indicative and may change.',
    priceList: 'Price list', at: 'as of {d}', number: 'No.', wing: 'Building', fl: 'Floor', interior: 'Interior', out: 'Outdoor', st: 'Status',
    listNote: 'Prices in euros. Not contractual, subject to availability.', plans: 'Floor plans', plan: 'Indicative plan, not contractual. All plans at the same scale.',
    unitsOf: 'Homes {u}', dossier: 'Brochure', dossierD: 'The project, the two buildings, the home types and the sales office.',
    priceListD: 'All 28 homes with areas, floor, price and availability.', plansD: 'One indicative plan per home type and building.',
  },
};
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #2b2420; background: #fff; }
.page { width: 210mm; height: 297mm; padding: 18mm 18mm 16mm; position: relative; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
.sans { font-family: Helvetica, Arial, sans-serif; }
.k { font: 600 7.5pt/1 Helvetica, Arial, sans-serif; letter-spacing: 0.16em; text-transform: uppercase; color: #675c53; }
h1 { font-weight: 400; font-size: 40pt; line-height: 1; margin: 5mm 0 4mm; }
h2 { font-weight: 400; font-size: 22pt; line-height: 1.1; margin: 3mm 0 6mm; }
p { font-size: 10.5pt; line-height: 1.6; margin: 0 0 3mm; }
.foot { position: absolute; left: 18mm; right: 18mm; bottom: 10mm; display: flex; justify-content: space-between; font: 7pt/1.4 Helvetica, Arial, sans-serif; color: #675c53; border-top: 0.6mm solid #d9654b; padding-top: 3mm; }
table { width: 100%; border-collapse: collapse; font: 8.3pt/1.3 Helvetica, Arial, sans-serif; }
th { text-align: left; font-weight: 600; font-size: 6.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: #675c53; padding: 2.2mm 1.6mm; border-bottom: 0.4mm solid #c9baa4; }
td { padding: 2.1mm 1.6mm; border-bottom: 0.2mm solid #e2d7c6; }
.r { text-align: right; }
tr.sold td, tr.reserved td.p { color: #8a7f74; }
.fig { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 0.3mm solid #c9baa4; border-bottom: 0.3mm solid #c9baa4; margin: 6mm 0; }
.fig div { padding: 5mm 3mm; border-left: 0.3mm solid #e2d7c6; }
.fig div:first-child { border-left: 0; padding-left: 0; }
.fig b { display: block; font-weight: 400; font-size: 19pt; line-height: 1.05; }
.fig span { font: 7pt/1.4 Helvetica, Arial, sans-serif; color: #675c53; }
.tiles { height: 7mm; background: repeating-linear-gradient(90deg, #d9654b 0 3.5mm, #f7f2e9 3.5mm 7mm); opacity: 0.8; }
.wg { margin-top: 3mm; }
`;

function build(lang) {
  const t = T[lang];
  const floor = (u) => (u.floor === 0 ? t.ground : `${t.floor} ${u.floor}`);
  const date = new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(today));
  const delivery = new Intl.DateTimeFormat(t.locale, { month: 'long', year: 'numeric' }).format(new Date(dev.delivery_date));
  const footer = (n) => `<div class="foot"><span>${dev.title} · ${dev.address.street}, ${dev.address.postcode} ${dev.address.city}</span><span>${org.name} · ${team.phone} · ${team.email}</span><span>${n}</span></div>`;
  const svg = (key, fit) => readFileSync(`public/plans/${lang}/${key}${fit ? '-fit' : ''}.svg`, 'utf8').replace(/width="\d+" height="\d+"/, 'width="100%"');
  const avail = units.filter((u) => u.status === 'available');
  const minPrice = Math.min(...avail.filter((u) => u.price).map((u) => u.price));
  const surf = units.map((u) => u.living_surface);
  const kinds = ['estudio', '1d', '2d', '3d', '4d', 'atico'].filter((k) => units.some((u) => kindOf(u) === k));

  const dossier = () => {
    const [p0, p1, p2, p3] = dev.photos;
    const tiles = dev.photos.find((p) => p.url.includes('5505437')) ?? p3;
    const roof = dev.photos.find((p) => p.url.includes('9584741')) ?? p2;
    const desc = dev.description_text.split('\n\n').map((p) => `<p lang="es">${p}</p>`).join('');
    const rows = kinds.map((k) => {
      const us = units.filter((u) => kindOf(u) === k);
      const av = us.filter((u) => u.status === 'available' && u.price);
      const s = us.map((u) => u.living_surface);
      return `<tr><td>${t.kinds[k]}</td><td class="r">${Math.min(...s) === Math.max(...s) ? m2(s[0]) : `${Math.min(...s)}–${m2(Math.max(...s))}`}</td><td class="r">${us.length}</td><td class="r">${av.length}</td><td class="r">${av.length ? `${t.from} ${eur(Math.min(...av.map((u) => u.price)))}` : '–'}</td></tr>`;
    }).join('');
    const wings = ['1908', 'nueva'].map((w) => {
      const us = units.filter((u) => wingOf(u) === w);
      const fs = us.map((u) => u.floor);
      return `<div><p class="k">${t.wings[w]}</p><p style="font-size:14pt;margin:2mm 0">${w === '1908' ? 'Carrer de Sueca 38' : 'Carrer de Sueca 40'}</p><p class="sans" style="font-size:8.5pt;color:#675c53">${floor({ floor: Math.min(...fs) })} – ${floor({ floor: Math.max(...fs) })} · ${us.length} ${t.units}, ${us.filter((u) => u.status === 'available').length} ${t.available}</p></div>`;
    }).join('');
    const credits = [[t.developer, dev.developer?.name], [t.architect, dev.architect?.name], [t.contractor, dev.general_contractor?.name]].filter((c) => c[1]);
    return `
<section class="page" style="padding:0;background:#f7f2e9">
  <img src="${photo(p0.url, 1240, 1300)}" style="width:100%;height:205mm;object-fit:cover;display:block">
  <div class="tiles"></div>
  <div style="padding:12mm 18mm">
    <p class="k">${t.cover}</p>
    <h1 style="font-size:46pt">${dev.title}</h1>
    <p style="font-size:13pt;color:#675c53">${dev.address.street} · ${t.delivery}: ${delivery}</p>
  </div>
</section>
<section class="page">
  <p class="k">${t.project}</p>
  <h2>${dev.title}</h2>
  <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:8mm">
    <div>${desc}</div>
    <img src="${photo(tiles.url, 700, 900)}" style="width:100%;height:100mm;object-fit:cover">
  </div>
  <div class="fig">
    <div><b>${avail.length} / ${units.length}</b><span>${t.units} ${t.available}</span></div>
    <div><b>${eur(minPrice)}</b><span>${t.from}</span></div>
    <div><b>${Math.min(...surf)}–${Math.max(...surf)} m²</b><span>${t.sizes}</span></div>
    <div><b style="font-size:15pt;line-height:1.35">${delivery}</b><span>${t.delivery.toLowerCase()}</span></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm" class="wg">${wings}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:6mm">
    <img src="${photo(p1.url, 700, 480)}" style="width:100%;height:52mm;object-fit:cover">
    <img src="${photo(roof.url, 700, 480)}" style="width:100%;height:52mm;object-fit:cover">
  </div>
  ${footer(2)}
</section>
<section class="page">
  <p class="k">${t.types}</p>
  <h2>${t.types}</h2>
  <table><thead><tr><th>${t.type}</th><th class="r">${t.interior}</th><th class="r">${t.count}</th><th class="r">${t.avail}</th><th class="r">${t.price}</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="sans" style="font-size:7.5pt;color:#675c53;margin-top:3mm">${fill(t.priceNote, { d: date })}</p>
  <div style="margin-top:8mm;border:0.3mm solid #e2d7c6">${svg('1908-3d', false)}</div>
  <p class="sans" style="font-size:7.5pt;color:#675c53;margin-top:2mm">${t.kinds['3d']}, ${t.wings['1908']}. ${t.plan}</p>
  ${footer(3)}
</section>
<section class="page">
  <p class="k">${t.credits}</p>
  <h2>${t.sales}</h2>
  ${credits.map(([k, v]) => `<p class="sans" style="font-size:9pt;margin:0 0 1mm;color:#675c53">${k}</p><p style="font-size:14pt;margin-bottom:5mm">${v}</p>`).join('')}
  <div style="margin-top:10mm;padding-top:8mm;border-top:0.3mm solid #e2d7c6">
    <p class="sans" style="font-size:9pt;color:#675c53;margin-bottom:1mm">${t.sales}</p>
    <p style="font-size:14pt;margin-bottom:1mm">${org.name}</p>
    <p>${org.address.street}, ${org.address.postcode} ${org.address.city}<br>${team.phone} · ${team.email}</p>
    ${agent ? `<p style="margin-top:5mm">${t.contact}: ${agent.first_name} ${agent.last_name}<br>${agent.phone} · ${agent.email}</p>` : ''}
  </div>
  <p class="sans" style="position:absolute;bottom:22mm;left:18mm;right:18mm;font-size:7pt;color:#8a7f74">${t.disclaimer}</p>
  ${footer(4)}
</section>`;
  };

  const priceList = () => {
    const rows = units.map((u) => `<tr class="${u.status}"><td>${u.reference ?? '–'}</td><td>${t.wings[wingOf(u)]}</td><td>${floor(u)}</td><td>${kindOf(u) === 'atico' ? `${t.kinds.atico}, ${u.bedrooms} ${lang === 'es' ? 'dorm.' : 'bed'}` : t.kinds[kindOf(u)]}</td><td class="r">${m2(u.living_surface)}</td><td class="r">${m2(outdoor(u))}</td><td class="r p">${u.status === 'available' && u.price ? eur(u.price) : '–'}</td><td>${t.status[u.status]}</td></tr>`).join('');
    return `<section class="page">
  <p class="k">${t.priceList} · ${fill(t.at, { d: date })}</p>
  <h1 style="font-size:30pt">${dev.title}</h1>
  <p class="sans" style="font-size:9pt;color:#675c53;margin-bottom:5mm">${units.length} ${t.units} · ${avail.length} ${t.available} · ${t.delivery.toLowerCase()} ${delivery}</p>
  <table><thead><tr><th>${t.number}</th><th>${t.wing}</th><th>${t.fl}</th><th>${t.type}</th><th class="r">${t.interior}</th><th class="r">${t.out}</th><th class="r">${t.price}</th><th>${t.st}</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="sans" style="font-size:7.5pt;color:#675c53;margin-top:4mm">${t.listNote}</p>
  ${footer(1)}
</section>`;
  };

  const plans = () => {
    const keys = [...new Set(units.map(planKey))].sort((a, b) => {
      const ka = units.find((u) => planKey(u) === a);
      const kb = units.find((u) => planKey(u) === b);
      return kinds.indexOf(kindOf(ka)) - kinds.indexOf(kindOf(kb)) || (wingOf(ka) === wingOf(kb) ? ka.bedrooms - kb.bedrooms : wingOf(ka) === '1908' ? -1 : 1);
    });
    return keys.map((key, i) => {
      const us = units.filter((u) => planKey(u) === key);
      const u = us[0];
      const name = kindOf(u) === 'atico' ? `${t.kinds.atico}, ${u.bedrooms} ${lang === 'es' ? 'dormitorios' : 'bedrooms'}` : t.kinds[kindOf(u)];
      return `<section class="page">
  <p class="k">${t.plans} · ${i + 1} / ${keys.length}</p>
  <h2>${name} · ${t.wings[wingOf(u)]}</h2>
  <p class="sans" style="font-size:9pt;color:#675c53">${fill(t.unitsOf, { u: us.map((x) => x.reference).filter(Boolean).join(', ') })}</p>
  <div style="margin-top:8mm;border:0.3mm solid #e2d7c6">${svg(key, false)}</div>
  <p class="sans" style="font-size:7.5pt;color:#675c53;margin-top:3mm">${t.plan}</p>
  ${footer(i + 1)}
</section>`;
    }).join('');
  };
  return [
    { id: 'dossier', title: t.dossier, description: t.dossierD, html: dossier },
    { id: 'precios', title: t.priceList, description: t.priceListD.replace('28', String(units.length)), html: priceList },
    { id: 'planos', title: t.plans, description: t.plansD, html: plans },
  ];
}

mkdirSync('public/documents', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const out = [];
for (const lang of ['es', 'en']) {
  for (const d of build(lang)) {
    await page.setContent(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${d.title} · ${dev.title}</title><style>${CSS}</style></head><body>${d.html()}</body></html>`, { waitUntil: 'networkidle' });
    const file = `${d.id}-casa-de-les-rajoles-${lang}.pdf`;
    const path = `public/documents/${file}`;
    await page.pdf({ path, format: 'A4', printBackground: true, preferCSSPageSize: true });
    const pdf = readFileSync(path, 'latin1');
    const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    out.push({ id: d.id, lang, href: `/documents/${file}`, title: d.title, description: d.description, pages, bytes: statSync(path).size });
  }
}
await browser.close();
writeFileSync('src/content/documents.json', `${JSON.stringify({ updated: today, files: out }, null, 2)}\n`);
console.log(out.map((d) => `${d.href} ${d.pages}p ${Math.round(d.bytes / 1024)} KB`).join('\n'));
