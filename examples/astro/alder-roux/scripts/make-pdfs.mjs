#!/usr/bin/env node
/**
 * Brochure and price list of "Les Rives de Bellerive" as small real PDFs,
 * printed with Playwright from HTML built here (fixture data, our own plans).
 * Fixture only: the API has no documents yet.
 *   node scripts/make-pdfs.mjs    (after scripts/make-plans.mjs)
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const fx = JSON.parse(readFileSync('src/data/fixture.json', 'utf8'));
const dev = fx.developments[0];
const extra = fx.fixture_only;
const chf = (n) => `CHF ${new Intl.NumberFormat('de-CH').format(n)}`;
const L = {
  fr: {
    brochure: 'les-rives-de-bellerive-brochure-fr.pdf', prices: 'les-rives-de-bellerive-prix-fr.pdf',
    kicker: 'Programme neuf · Collonge-Bellerive', units: 'lots', from: 'dès', delivery: 'Livraison', types: 'Typologies',
    plan: 'Plan indicatif, non contractuel', priceList: 'Liste de prix', asOf: 'État au', lot: 'Lot', floor: 'Étage', rooms: 'Pièces',
    area: 'Surface', out: 'Extérieur', price: 'Prix', status: 'Statut', available: 'Disponible', reserved: 'Réservé', sold: 'Vendu',
    developer: 'Maître d’ouvrage', architect: 'Architecte', contact: 'Contact', note: 'Prix indicatifs, sous réserve de modification. Document non contractuel.',
    floors: ['Rez-de-chaussée', '1er étage', '2e étage', '3e étage'], roomsW: 'pièces', month: { month: 'long', year: 'numeric' }, locale: 'fr-CH',
  },
  de: {
    brochure: 'les-rives-de-bellerive-broschuere-de.pdf', prices: 'les-rives-de-bellerive-preise-de.pdf',
    kicker: 'Neubauprojekt · Collonge-Bellerive', units: 'Einheiten', from: 'ab', delivery: 'Bezug', types: 'Wohnungstypen',
    plan: 'Grundriss unverbindlich', priceList: 'Preisliste', asOf: 'Stand', lot: 'Einheit', floor: 'Geschoss', rooms: 'Zimmer',
    area: 'Fläche', out: 'Aussen', price: 'Preis', status: 'Status', available: 'Verfügbar', reserved: 'Reserviert', sold: 'Verkauft',
    developer: 'Bauherrschaft', architect: 'Architektur', contact: 'Kontakt', note: 'Richtpreise, Änderungen vorbehalten. Unverbindliches Dokument.',
    floors: ['Erdgeschoss', '1. Obergeschoss', '2. Obergeschoss', '3. Obergeschoss'], roomsW: 'Zimmer', month: { month: 'long', year: 'numeric' }, locale: 'de-CH',
  },
};
const css = `@page{size:A4;margin:16mm}body{font-family:Georgia,serif;color:#17202c;margin:0}h1{font-weight:400;font-size:40px;margin:0 0 8px;color:#1f3a5f}h2{font-weight:400;font-size:22px;color:#1f3a5f;margin:28px 0 10px;border-bottom:1px solid #d9dee5;padding-bottom:6px}.k{font:600 10px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#82632f}.lead{font-size:15px;line-height:1.55}.figs{display:flex;gap:28px;margin:18px 0;font:13px Arial,sans-serif}.figs b{display:block;font:400 20px Georgia,serif;color:#1f3a5f}table{width:100%;border-collapse:collapse;font:11.5px Arial,sans-serif}th,td{text-align:left;padding:7px 6px;border-bottom:1px solid #d9dee5}th{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#586373}.r{text-align:right}.plans{display:grid;grid-template-columns:1fr 1fr;gap:14px}.plans figure{margin:0;border:1px solid #d9dee5;padding:8px;break-inside:avoid}.plans img{width:100%}.plans figcaption{font:11px Arial,sans-serif;color:#586373}.foot{font:10px Arial,sans-serif;color:#586373;margin-top:18px}.band{background:#1f3a5f;color:#fff;padding:22px 24px;margin:-16mm -16mm 18px}.band h1{color:#fff}.band .k{color:#dcc193}`;
const imgSrc = (url, w) => `https://img.realadvisor.ch/_/rs:fill:${w}:${Math.round(w * 0.56)}:1:0/q:70/${Buffer.from(url).toString('base64url')}.jpg`;
const typeKey = (u) => `${u.rooms}${/attic|penthouse/.test(u.property_type) ? '-attique' : ''}`;

mkdirSync('public/documents', { recursive: true });
const browser = await chromium.launch();
for (const [lang, t] of Object.entries(L)) {
  const units = [...dev.units].sort((a, b) => a.floor - b.floor || (extra.units[a.id]?.position ?? 0) - (extra.units[b.id]?.position ?? 0));
  const agent = dev.agents[0];
  const primary = fx.teams.find((x) => x.primary);
  const keys = [...new Set(units.map(typeKey))];
  const plans = keys.map((k, i) => {
    const svg = readFileSync(`public/plans/${lang}/${k}.svg`, 'utf8');
    const us = units.filter((u) => typeKey(u) === k);
    return `<figure><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"><figcaption>${String.fromCharCode(65 + i)} · ${us[0].rooms} ${t.roomsW} · ${Math.min(...us.map((u) => u.living_surface))}–${Math.max(...us.map((u) => u.living_surface))} m²</figcaption></figure>`;
  }).join('');
  const brochure = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>${css}</style><body>
    <div class="band"><p class="k">${t.kicker}</p><h1>${dev.title}</h1></div>
    <img src="${imgSrc(dev.photos[0].url, 1400)}" style="width:100%;margin-bottom:14px">
    <div class="lead">${dev.description}</div>
    <div class="figs"><div><b>${dev.stats.units}</b>${t.units}</div><div><b>${t.from} ${chf(dev.stats.price.min)}</b>${t.price}</div><div><b>${dev.stats.living_surface.min}–${dev.stats.living_surface.max} m²</b>${t.area}</div><div><b>${new Intl.DateTimeFormat(t.locale, t.month).format(new Date(dev.delivery_date))}</b>${t.delivery}</div></div>
    <p class="foot">${t.developer}: ${extra.developments[dev.id].developer} · ${t.architect}: ${extra.developments[dev.id].architect}</p>
    <h2 style="break-before:page">${t.types}</h2><div class="plans">${plans}</div><p class="foot">${t.plan}</p>
    <h2>${t.contact}</h2><p class="lead">${fx.organisation.name}<br>${primary.address.street}, ${primary.address.postcode} ${primary.address.city}<br>${agent.first_name} ${agent.last_name} · ${agent.phone} · ${agent.email}</p>
  </body></html>`;
  const status = (s) => t[s];
  const rows = units.map((u) => {
    const x = extra.units[u.id] ?? {};
    return `<tr><td>${x.unit_number ?? ''}</td><td>${t.floors[u.floor] ?? u.floor}</td><td>${u.rooms}</td><td class="r">${u.living_surface} m²</td><td class="r">${x.terrace_surface ?? u.balcony_surface ?? ''} m²</td><td class="r">${u.status === 'available' && u.price ? chf(u.price) : '–'}</td><td>${status(u.status)}</td></tr>`;
  }).join('');
  const prices = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>${css}</style><body>
    <div class="band"><p class="k">${t.kicker}</p><h1>${t.priceList} · ${dev.title}</h1></div>
    <p class="foot">${t.asOf} ${new Intl.DateTimeFormat(t.locale).format(new Date('2026-11-11'))}</p>
    <table><thead><tr><th>${t.lot}</th><th>${t.floor}</th><th>${t.rooms}</th><th class="r">${t.area}</th><th class="r">${t.out}</th><th class="r">${t.price}</th><th>${t.status}</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="foot">${t.note}</p><p class="foot">${fx.organisation.name} · ${agent.first_name} ${agent.last_name} · ${agent.phone} · ${agent.email}</p>
  </body></html>`;
  const page = await browser.newPage();
  for (const [file, html] of [[t.brochure, brochure], [t.prices, prices]]) {
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({ path: `public/documents/${file}`, format: 'A4', printBackground: true });
    console.log(file);
  }
  await page.close();
}
await browser.close();
