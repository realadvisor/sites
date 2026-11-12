#!/usr/bin/env node
// Generates the development's documents as real PDFs from HTML (Playwright
// page.pdf) into public/documents/, plus src/lib/documents.json (name, file,
// pages, size) for the Dokumente page. Data: src/data/fixture.json (SDK data
// and its fixture_only part, marked below). Plans: public/plans (scripts/plans.mjs).
//
//   node scripts/plans.mjs && node scripts/documents.mjs
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
const fx = JSON.parse(readFileSync(new URL('src/data/fixture.json', root), 'utf8'));
const dev = fx.developments[0];
const team = fx.teams.find((t) => t.primary) ?? fx.teams[0];
// fixture only: unit number, building, move-in date, charges; developer, architect
const xu = (id) => fx.fixture_only.units[id] ?? {};
const xd = fx.fixture_only.developments[dev.id] ?? {};
const STAND = '11. November 2026';

const chf = (n) => `CHF ${new Intl.NumberFormat('de-CH').format(n)}`;
const month = (iso) => new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00Z`));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const STATUS = { available: 'Frei', reserved: 'Reserviert', sold: 'Vermietet' };
const units = dev.units
  .map((u) => ({ u, x: xu(u.id) }))
  .sort((a, b) => (a.x.building ?? '').localeCompare(b.x.building ?? '') || (a.u.floor ?? 0) - (b.u.floor ?? 0) || (a.x.position ?? 0) - (b.x.position ?? 0));
const houses = [...new Set(units.map((r) => r.x.building))].sort();
const types = [...new Set(units.map((r) => r.u.rooms))].sort((a, b) => a - b);
const plan = (rooms) => readFileSync(new URL(`public/plans/typ-${String(rooms).replace('.', '-')}-s.svg`, root), 'utf8');
// Free and reserved units show their rent (as on the site), let units none; "ab" figures use free units only.
const rentOf = (u) => (u.status !== 'sold' && u.price ? u.price : null);
const freeRentOf = (u) => (u.status === 'available' ? rentOf(u) : null);

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font: 10.5pt/1.45 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #140F3A; }
.page { width: 210mm; height: 297mm; padding: 16mm 16mm 14mm; position: relative; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
h1 { font-size: 46pt; line-height: 0.95; letter-spacing: -0.03em; margin: 0; font-weight: 800; }
h2 { font-size: 22pt; line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 6mm; font-weight: 800; }
h3 { font-size: 13pt; margin: 0 0 2mm; }
p { margin: 0 0 3mm; }
.eyebrow { font-size: 8.5pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.foot { position: absolute; left: 16mm; right: 16mm; bottom: 9mm; display: flex; justify-content: space-between; font-size: 8pt; color: #4A4566; }
.z { background: #E4572E; } .ink { background: #140F3A; color: #fff; } .lilac { background: #CDC2FF; } .butter { background: #FFD966; }
.mark { display: inline-flex; align-items: center; gap: 3mm; }
.mark i { width: 10mm; height: 10mm; border-radius: 2mm; background: #E4572E; display: inline-block; border: 0.6mm solid #140F3A; }
.mark b { font-size: 15pt; line-height: 1; }
table { width: 100%; border-collapse: collapse; font-size: 8.6pt; }
th { text-align: left; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.05em; color: #4A4566; border-bottom: 0.5mm solid #140F3A; padding: 1.6mm 1.4mm; }
td { padding: 1.45mm 1.4mm; border-bottom: 0.2mm solid #d8cfc2; }
td.r, th.r { text-align: right; }
tr.sold td { color: #6b6585; }
.plan svg { width: 100%; height: auto; }
`;

const doc = (pages) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${pages.join('')}</body></html>`;
const foot = (name) => `<div class="foot"><span>${esc(dev.title)} · ${esc(name)}</span><span>Stand ${STAND} · Angaben ohne Gewähr</span></div>`;
const mark = `<span class="mark"><i></i><b>Quartier<br>Zinnober</b></span>`;

// 1. Brochure
const stats = dev.stats;
const moves = houses.map((h) => [h, units.find((r) => r.x.building === h)?.x.move_in_date]).filter(([, d]) => d);
const brochure = doc([
  `<section class="page z" style="display:flex;flex-direction:column;justify-content:space-between">
    ${mark}
    <div><p class="eyebrow">Erstvermietung · ${esc(dev.address.city)}</p><h1>${stats.units} Mietwohnungen<br>im Tössfeld, ${esc(dev.address.city)}</h1></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;border-top:0.6mm solid #140F3A;padding-top:5mm">
      <div><b style="font-size:18pt">${stats.rooms.min}–${stats.rooms.max}</b><br>Zimmer</div>
      <div><b style="font-size:18pt">${stats.living_surface.min}–${stats.living_surface.max} m²</b><br>Wohnfläche</div>
      <div><b style="font-size:18pt">${moves.map(([, d]) => month(d).split(' ')[0]).join(', ')}</b><br>Bezug 2027</div>
    </div>
  </section>`,
  `<section class="page">
    <p class="eyebrow">Das Quartier</p><h2>Wohnen zwischen Bahnhof und Hof</h2>
    <div style="columns:2;column-gap:10mm">${dev.description}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:10mm">
      ${moves.map(([h, d], i) => `<div class="${['z', 'lilac', 'butter'][i] ?? 'lilac'}" style="padding:6mm;border:0.6mm solid #140F3A;border-radius:4mm"><b style="font-size:22pt">Haus ${h}</b><p style="margin-top:3mm">Bezug ab<br><b>${month(d)}</b></p><p>${units.filter((r) => r.x.building === h && r.u.status === 'available').length} von ${units.filter((r) => r.x.building === h).length} frei</p></div>`).join('')}
    </div>
    <table style="margin-top:12mm;font-size:10pt"><tbody>
      ${xd.developer ? `<tr><td>Bauherrschaft</td><td><b>${esc(xd.developer)}</b></td></tr>` : ''}
      ${xd.architect ? `<tr><td>Architektur</td><td><b>${esc(xd.architect)}</b></td></tr>` : ''}
      ${xd.general_contractor ? `<tr><td>Totalunternehmung</td><td><b>${esc(xd.general_contractor)}</b></td></tr>` : ''}
      <tr><td>Adresse</td><td><b>${esc(dev.address.street)}, ${esc(dev.address.postcode)} ${esc(dev.address.city)}</b></td></tr>
    </tbody></table>
    ${foot('Broschüre')}
  </section>`,
  `<section class="page">
    <p class="eyebrow">Wohnungstypen</p><h2>Vier Grundrisse</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm">
      ${types.map((t) => {
        const rs = units.filter((r) => r.u.rooms === t);
        const rents = rs.map((r) => freeRentOf(r.u)).filter(Boolean);
        return `<div style="border:0.5mm solid #140F3A;border-radius:3mm;padding:4mm"><div class="plan">${plan(t)}</div><p style="margin:2mm 0 0"><b>${String(t)} Zimmer</b> · ${rs[0].u.living_surface} m² · ${rents.length ? `ab ${chf(Math.min(...rents))} netto` : 'zurzeit vergeben'} · ${rs.filter((r) => r.u.status === 'available').length} frei</p></div>`;
      }).join('')}
    </div>
    ${foot('Broschüre')}
  </section>`,
  `<section class="page ink" style="display:flex;flex-direction:column;justify-content:space-between">
    <div><p class="eyebrow" style="color:#FFD966">Kontakt</p><h2 style="font-size:36pt">Interesse anmelden</h2>
    <p style="font-size:13pt;max-width:120mm">Senden Sie uns Ihre Anfrage über die Website oder rufen Sie an. Sie erhalten die Bewerbungsunterlagen und einen Termin für die Musterwohnung.</p></div>
    <div style="font-size:13pt"><b>${esc(team.name)}</b><br>${esc(team.address.street)}, ${esc(team.address.postcode)} ${esc(team.address.city)}<br>${esc(team.phone)}<br>${esc(team.email)}<br><br>${esc(fx.organisation.website ?? '')}</div>
    <p style="font-size:8pt;color:#d9d4ee">Alle Angaben ohne Gewähr. Grundrisse indikativ. Stand ${STAND}.</p>
  </section>`,
]);

// 2. Rent list
const rows = (rs) => rs.map(({ u, x }) => `<tr class="${u.status}"><td><b>${esc(x.unit_number)}</b></td><td>Haus ${esc(x.building)}</td><td>${u.floor === 0 ? 'EG' : `${u.floor}. OG`}</td><td>${String(u.rooms)}</td><td class="r">${u.living_surface} m²</td><td class="r">${u.balcony_surface ?? ''} m²</td><td>${x.move_in_date ? month(x.move_in_date) : ''}</td><td class="r">${rentOf(u) ? chf(u.price) : '–'}</td><td class="r">${rentOf(u) && x.charges ? chf(x.charges) : '–'}</td><td class="r"><b>${rentOf(u) && x.charges ? chf(u.price + x.charges) : '–'}</b></td><td>${STATUS[u.status]}</td></tr>`).join('');
const head = `<thead><tr><th>Nr.</th><th>Haus</th><th>Geschoss</th><th>Zimmer</th><th class="r">Fläche</th><th class="r">Aussen</th><th>Bezug</th><th class="r">Netto</th><th class="r">NK</th><th class="r">Brutto</th><th>Status</th></tr></thead>`;
const half = Math.ceil(units.length / 2);
const rentlist = doc([0, 1].map((p) => `<section class="page">
  <div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:6mm">${mark}<div style="text-align:right"><p class="eyebrow">Mietzinsliste</p><b>${stats.available} von ${stats.units} frei</b></div></div>
  <table>${head}<tbody>${rows(units.slice(p * half, (p + 1) * half))}</tbody></table>
  <p style="margin-top:5mm;font-size:8pt;color:#4A4566">Mieten pro Monat in CHF. Netto = Nettomiete, NK = Nebenkosten (Akonto), Brutto = Netto + NK. Reservierte Wohnungen mit Mietzins (Warteliste möglich), vermietete ohne.</p>
  ${foot(`Mietzinsliste, Seite ${p + 1}`)}
</section>`));

// 3. Plans
const plans = doc(types.map((t) => {
  const rs = units.filter((r) => r.u.rooms === t);
  return `<section class="page">
    <div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:10mm">${mark}<p class="eyebrow">Grundrisse</p></div>
    <h2>${String(t)} Zimmer · ${rs[0].u.living_surface} m²</h2>
    <div class="plan" style="border:0.5mm solid #140F3A;border-radius:3mm;overflow:hidden">${plan(t)}</div>
    <p style="margin-top:6mm">Wohnungen dieses Typs: ${rs.map((r) => esc(r.x.unit_number)).join(', ')}.</p>
    <p style="font-size:8.5pt;color:#4A4566">Grundriss indikativ, gespiegelt oder gedreht je nach Lage im Haus. Massgebend sind die Ausführungspläne. Loggia beziehungsweise Gartensitzplatz je nach Geschoss.</p>
    ${foot('Grundrisse')}
  </section>`;
}));

const out = new URL('public/documents/', root);
mkdirSync(out, { recursive: true });
const files = [
  { file: 'quartier-zinnober-broschuere.pdf', name: 'Broschüre', text: 'Das Quartier, die drei Häuser, die Wohnungstypen und der Kontakt.', html: brochure },
  { file: 'quartier-zinnober-mietzinsliste.pdf', name: 'Mietzinsliste', text: `Alle ${stats.units} Wohnungen mit Nettomiete, Nebenkosten, Bezug und Status.`, html: rentlist },
  { file: 'quartier-zinnober-grundrisse.pdf', name: 'Grundrisse', text: 'Die vier Wohnungstypen als indikative Grundrisse.', html: plans },
];
const browser = await chromium.launch();
const page = await browser.newPage();
const manifest = [];
for (const f of files) {
  await page.setContent(f.html, { waitUntil: 'load' });
  const pages = await page.evaluate(() => document.querySelectorAll('.page').length);
  await page.pdf({ path: new URL(f.file, out).pathname, format: 'A4', printBackground: true, preferCSSPageSize: true });
  manifest.push({ file: `/documents/${f.file}`, name: f.name, text: f.text, pages, bytes: statSync(new URL(f.file, out)).size, date: '2026-11-11' });
}
await browser.close();
writeFileSync(new URL('src/lib/documents.json', root), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(manifest.map((m) => `${m.file} ${m.pages} p. ${Math.round(m.bytes / 1024)} kB`).join('\n'));
