#!/usr/bin/env node
/**
 * Brochure and price list of the Dorenbachhof as small real PDFs in German,
 * French and English, printed with Playwright from HTML built here (fixture
 * data, the plans drawn by scripts/make-plans.mjs). Fixture only: the API has
 * no documents yet. Writes src/content/document-sizes.json for the links.
 *   node scripts/make-pdfs.mjs    (after scripts/make-plans.mjs)
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const fx = JSON.parse(readFileSync('src/data/fixture.json', 'utf8'));
const dev = fx.developments[0];
const extra = fx.fixture_only;
const chf = (n) => `CHF ${new Intl.NumberFormat('de-CH').format(n)}`;
const dec = (n, lang) => (lang === 'en' ? String(n) : String(n).replace('.', ','));
const L = {
  de: {
    brochure: 'dorenbachhof-broschuere.pdf', prices: 'dorenbachhof-preisliste.pdf', locale: 'de-CH',
    kicker: 'Neubau · Basel Bachletten', units: 'Wohnungen', from: 'ab', delivery: 'Bezug', types: 'Wohnungstypen', available: 'verfügbar',
    plan: 'Grundrisse unverbindlich, nur zur Orientierung', priceList: 'Preisliste', asOf: 'Stand', no: 'Nr.', floor: 'Geschoss', rooms: 'Zimmer',
    area: 'Wohnfläche', out: 'Aussen', price: 'Preis', status: 'Status', st: { available: 'Verfügbar', reserved: 'Reserviert', sold: 'Verkauft' },
    developer: 'Bauherrschaft', architect: 'Architektur', contractor: 'Generalunternehmung', contact: 'Verkauf',
    note: 'Richtpreise, Änderungen vorbehalten. Reservierte und verkaufte Wohnungen ohne Preis. Unverbindliches Dokument.',
    fl: (u) => (/penthouse|attic/.test(u.property_type) ? 'Attika' : u.floor === 0 ? 'EG' : `${u.floor}. OG`),
  },
  fr: {
    brochure: 'dorenbachhof-brochure-fr.pdf', prices: 'dorenbachhof-prix-fr.pdf', locale: 'fr-CH',
    kicker: 'Logements neufs · Bâle Bachletten', units: 'appartements', from: 'dès', delivery: 'Livraison', types: 'Typologies', available: 'disponibles',
    plan: 'Plans indicatifs, non contractuels', priceList: 'Liste de prix', asOf: 'État au', no: 'N°', floor: 'Étage', rooms: 'Pièces',
    area: 'Surface', out: 'Extérieur', price: 'Prix', status: 'Statut', st: { available: 'Disponible', reserved: 'Réservé', sold: 'Vendu' },
    developer: 'Maître d’ouvrage', architect: 'Architecte', contractor: 'Entreprise générale', contact: 'Vente',
    note: 'Prix indicatifs, sous réserve de modification. Appartements réservés et vendus sans prix. Document non contractuel.',
    fl: (u) => (/penthouse|attic/.test(u.property_type) ? 'Attique' : u.floor === 0 ? 'Rez' : u.floor === 1 ? '1er' : `${u.floor}e`),
  },
  en: {
    brochure: 'dorenbachhof-brochure-en.pdf', prices: 'dorenbachhof-prices-en.pdf', locale: 'en-CH',
    kicker: 'New homes · Basel Bachletten', units: 'flats', from: 'from', delivery: 'Move-in', types: 'Flat types', available: 'available',
    plan: 'Indicative plans, not part of any contract', priceList: 'Price list', asOf: 'As of', no: 'No.', floor: 'Floor', rooms: 'Rooms',
    area: 'Area', out: 'Outdoor', price: 'Price', status: 'Status', st: { available: 'Available', reserved: 'Reserved', sold: 'Sold' },
    developer: 'Developer', architect: 'Architect', contractor: 'General contractor', contact: 'Sales',
    note: 'Indicative prices, subject to change. Reserved and sold flats are shown without a price. Not a contractual document.',
    fl: (u) => (/penthouse|attic/.test(u.property_type) ? 'Penthouse' : u.floor === 0 ? 'Ground' : `${u.floor}${['th', 'st', 'nd', 'rd'][u.floor] ?? 'th'}`),
  },
};
const css = `@page{size:A4;margin:16mm}body{font-family:Georgia,serif;color:#1b2420;margin:0}h1{font-weight:400;font-size:40px;margin:0 0 6px}h2{font-weight:400;font-size:22px;color:#1f4d3a;margin:26px 0 10px;border-bottom:1px solid #dcd8d1;padding-bottom:6px}.k{font:600 11px Arial,sans-serif;color:#b9d4c3}.lead{font-size:14.5px;line-height:1.55}.lead p{margin:0 0 8px}.figs{display:flex;gap:28px;margin:16px 0;font:12px Arial,sans-serif;color:#59615c}.figs b{display:block;font:400 19px Georgia,serif;color:#1f4d3a}table{width:100%;border-collapse:collapse;font:11.5px Arial,sans-serif}th,td{text-align:left;padding:7px 6px;border-bottom:1px solid #dcd8d1}th{font-size:10px;color:#59615c;font-weight:600}.r{text-align:right}.plans{display:grid;grid-template-columns:1fr 1fr;gap:12px}.plans figure{margin:0;border:1px solid #dcd8d1;padding:8px;break-inside:avoid}.plans img{width:100%}.plans figcaption{font:11px Arial,sans-serif;color:#59615c}.foot{font:10px Arial,sans-serif;color:#59615c;margin-top:16px}.band{background:#1f4d3a;color:#fff;padding:22px 24px;margin:-16mm -16mm 16px}.band h1{color:#fff}`;
const imgSrc = (url, w) => `https://img.realadvisor.ch/_/rs:fill:${w}:${Math.round(w * 0.56)}:1:0/q:70/${Buffer.from(url).toString('base64url')}.jpg`;
const planKey = (u) => `${String(u.rooms).replace('.', '-')}${/attic|penthouse/.test(u.property_type) ? '-attika' : u.floor === 0 ? '-eg' : ''}`;
const sizes = {};

mkdirSync('public/documents', { recursive: true });
const browser = await chromium.launch();
for (const [lang, t] of Object.entries(L)) {
  const units = [...dev.units].sort((a, b) => a.floor - b.floor || (extra.units[a.id]?.position ?? 0) - (extra.units[b.id]?.position ?? 0));
  const agent = dev.agents[0];
  const team = fx.teams.find((x) => dev.team_ids.includes(x.id)) ?? fx.teams[0];
  const keys = [...new Set(units.filter((u) => u.floor !== 0).map(planKey))];
  const plans = keys.map((k) => {
    const svg = readFileSync(`public/plans/${lang}/${k}.svg`, 'utf8');
    const us = units.filter((u) => planKey(u) === k);
    const att = /attika/.test(k) ? `${L[lang].fl(us[0])}, ` : '';
    return `<figure><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"><figcaption>${att}${dec(us[0].rooms, lang)} ${t.rooms} · ${us[0].living_surface} m²</figcaption></figure>`;
  }).join('');
  const brochure = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>${css}</style><body>
    <div class="band"><p class="k">${t.kicker}</p><h1>${dev.title}</h1><p style="font:13px Arial,sans-serif;margin:0">${dev.address.street}, ${dev.address.postcode} ${dev.address.city}</p></div>
    <img src="${imgSrc(dev.photos[0].url, 1400)}" style="width:100%;margin-bottom:12px">
    <div class="lead">${dev.description}</div>
    <div class="figs"><div><b>${dev.stats.units}</b>${t.units}</div><div><b>${dev.stats.available}</b>${t.available}</div><div><b>${t.from} ${chf(dev.stats.price.min)}</b>${t.price}</div><div><b>${new Intl.DateTimeFormat(t.locale, { month: 'long', year: 'numeric' }).format(new Date(dev.delivery_date))}</b>${t.delivery}</div></div>
    <p class="foot">${t.developer}: ${dev.developer?.name ?? ''} · ${t.architect}: ${dev.architect?.name ?? ''} · ${t.contractor}: ${dev.general_contractor?.name ?? ''}</p>
    <h2 style="break-before:page">${t.types}</h2><div class="plans">${plans}</div><p class="foot">${t.plan}</p>
    <h2>${t.contact}</h2><p class="lead">${fx.organisation.name}, ${team.name}<br>${team.address.street}, ${team.address.postcode} ${team.address.city}<br>${agent.first_name} ${agent.last_name} · ${agent.phone} · ${agent.email}</p>
  </body></html>`;
  const rows = units.map((u) => {
    const out = u.garden_surface ?? u.terrace_surface ?? u.balcony_surface;
    return `<tr><td>${u.reference ?? ''}</td><td>${t.fl(u)}</td><td class="r">${dec(u.rooms, lang)}</td><td class="r">${u.living_surface} m²</td><td class="r">${out != null ? `${out} m²` : ''}</td><td class="r">${u.status === 'available' && u.price ? chf(u.price) : '–'}</td><td>${t.st[u.status]}</td></tr>`;
  }).join('');
  const prices = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>${css}</style><body>
    <div class="band"><p class="k">${t.kicker}</p><h1>${t.priceList} · ${dev.title}</h1></div>
    <p class="foot">${t.asOf} ${new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</p>
    <table><thead><tr><th>${t.no}</th><th>${t.floor}</th><th class="r">${t.rooms}</th><th class="r">${t.area}</th><th class="r">${t.out}</th><th class="r">${t.price}</th><th>${t.status}</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="foot">${t.note}</p><p class="foot">${fx.organisation.name} · ${agent.first_name} ${agent.last_name} · ${agent.phone} · ${agent.email}</p>
  </body></html>`;
  const page = await browser.newPage();
  for (const [file, html] of [[t.brochure, brochure], [t.prices, prices]]) {
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({ path: `public/documents/${file}`, format: 'A4', printBackground: true });
    sizes[file] = Math.max(1, Math.round(statSync(`public/documents/${file}`).size / 1024));
    console.log(file, `${sizes[file]} KB`);
  }
  await page.close();
}
await browser.close();
writeFileSync('src/content/document-sizes.json', `${JSON.stringify(sizes, null, 1)}\n`);
