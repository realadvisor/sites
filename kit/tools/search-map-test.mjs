/**
 * Browser test of the map in the listing search (@realadvisor/sites-kit/components/ListingsSearch.astro):
 *
 *   1. a cluster click zooms in, and the list follows the new area (`bbox`);
 *   2. a dot click opens its card (a link to the listing);
 *   3. moving the map filters the list and the count to the visible area:
 *      every card is a listing inside it, the URL carries it and a reload
 *      shows the same results; another filter applies inside the area;
 *   4. an area with no listing shows [data-rs-empty="area"], markers kept.
 *
 * Run it against a running site (`pnpm dev` first):
 *
 *   pnpm kit test map                              # http://localhost:4321/listings
 *   pnpm kit test map --url http://localhost:4391 --path /proprietes
 *
 * `data` (the agency fixture in src/data/, loadData) checks the cards
 * against the listings' coordinates; without it those checks are skipped.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const W = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (s) => Number(String(s ?? '').replace(/\D/g, '')) || 0;
const params = (page) => new URL(page.url()).searchParams;
const zoomOf = (page) => Number((params(page).get('map') ?? '').split('/')[0]) || 0;

/** Waits until `fn(page)` is true (polling), or `ms` passed. */
const until = async (page, fn, ms = 8000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn(page)) return true;
    await W(200);
  }
  return false;
};

const state = (page) =>
  page.evaluate(() => ({
    count: document.querySelector('[data-rs-count]')?.textContent?.trim() ?? '',
    ids: [...document.querySelectorAll('#rs-results > li[data-listing-id]')].map((li) => li.getAttribute('data-listing-id')),
    empty: document.querySelector('[data-rs-empty]')?.getAttribute('data-rs-empty') ?? null,
    markers: document.querySelectorAll('[data-rs-map] [data-map-markers] :is(.ra-map-pin, .ra-map-cluster)').length,
  }));

/**
 * Runs the checks in a fresh 1440x900 page of `browser`; `fail(path, message)`
 * gets each problem. Returns the number of checks that ran.
 */
export async function checkSearchMap({ browser, base, path = '/listings', data = null, fail }) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const at = (p) => `${path}${p}`;
  const byId = new Map((data?.listings ?? []).map((l) => [l.id, l]));
  const inBox = (id, b) => {
    const l = byId.get(id);
    return !l || (l.address?.lat >= b[0] && l.address?.lat <= b[2] && l.address?.lng >= b[1] && l.address?.lng <= b[3]);
  };
  const box = () => (params(page).get('bbox') ?? '').split(',').map(Number);
  let ran = 0;
  try {
    await page.goto(`${base}${at('?view=map')}`, { waitUntil: 'load' });
    if (!(await until(page, async (p) => (await state(p)).markers > 0, 6000))) {
      fail(at('?view=map'), 'no map marker after 6 s');
      return ran;
    }
    await page.locator('[data-rs-map]').scrollIntoViewIfNeeded();
    const start = await state(page);

    // 1. Cluster: zooms in, the list follows.
    const cluster = page.locator('[data-rs-map] .ra-map-cluster');
    if (await cluster.count()) {
      ran++;
      await cluster.first().click();
      const ok = await until(page, (p) => zoomOf(p) > 0 && params(p).has('bbox'));
      if (!ok) fail(at('?view=map'), 'clicking a cluster did not zoom in and filter the list (no map= and bbox= in the URL after 8 s)');
      else {
        await until(page, async (p) => (await state(p)).count !== start.count, 3000);
        const s = await state(page);
        if (num(s.count) > num(start.count)) fail(page.url(), `after a cluster zoom the count grew (${start.count} → ${s.count})`);
        const out = s.ids.filter((id) => !inBox(id, box()));
        if (out.length) fail(page.url(), `after a cluster zoom ${out.length} card(s) lie outside the visible area`);
      }
    }

    // 2. Dot: its card opens, with a link to the listing.
    for (let i = 0; i < 6 && !(await page.locator('[data-rs-map] .ra-map-pin').count()); i++) {
      if (!(await cluster.count())) break;
      await cluster.first().click();
      await W(1200);
    }
    const pin = page.locator('[data-rs-map] .ra-map-pin');
    if (await pin.count()) {
      ran++;
      await pin.first().click();
      const open = await until(page, (p) => p.locator('[data-map-popup].is-open a.ra-map-card[href]').count().then((n) => n > 0), 4000);
      if (!open) fail(page.url(), 'clicking a dot opened no card (no [data-map-popup].is-open a.ra-map-card[href])');
      await page.locator('[data-map-popup] .ra-map-close').click().catch(() => {});
      await W(400);
    }

    // 3. Moving the map filters list and count to the area; reload keeps it.
    ran++;
    await page.locator('[data-map-zoom="-1"]').click();
    await W(600);
    await page.locator('[data-map-zoom="-1"]').click();
    const before = params(page).get('bbox');
    await until(page, (p) => params(p).get('bbox') !== before, 4000);
    const vp = await page.locator('[data-map-viewport]').boundingBox();
    // Grab the map itself, not a marker, the popup or a control.
    const [cx, cy] = await page.evaluate((b) => {
      for (let fy = 0.5; fy < 0.95; fy += 0.08) for (let fx = 0.5; fx < 0.95; fx += 0.08) {
        const [x, y] = [b.x + b.width * fx, b.y + b.height * fy];
        const el = document.elementFromPoint(x, y);
        if (el?.closest('[data-map-viewport]') && !el.closest('button, a, [data-map-popup], .rs-follow')) return [x, y];
      }
      return [b.x + b.width / 2, b.y + b.height / 2];
    }, vp);
    const dragged = params(page).get('bbox');
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(cx - (i * vp.width) / 25, cy, { steps: 2 });
    await page.mouse.up();
    if (!(await until(page, (p) => params(p).get('bbox') !== dragged))) fail(page.url(), 'dragging the map did not update the area (bbox= in the URL)');
    await W(800);
    const area = await state(page);
    const outside = area.ids.filter((id) => !inBox(id, box()));
    if (outside.length) fail(page.url(), `${outside.length} card(s) lie outside the visible area after a drag`);
    if (num(area.count) < area.ids.length) fail(page.url(), `the count (${area.count}) is lower than the cards shown (${area.ids.length})`);
    const url = page.url();
    await page.reload({ waitUntil: 'load' });
    await W(800);
    const again = await state(page);
    if (page.url() !== url) fail(url, `a reload changed the URL (${page.url()})`);
    if (again.count !== area.count || again.ids.join() !== area.ids.join()) fail(url, `a reload shows other results (${area.count} → ${again.count})`);

    // Another filter applies inside the area (both stay in the URL).
    const offer = page.locator('input[name=offerType]:not(:checked)').last();
    if (await offer.count()) {
      ran++;
      const bbox = params(page).get('bbox');
      await offer.evaluate((el) => el.click());
      await until(page, (p) => params(p).has('offerType'));
      await W(800);
      if (params(page).get('bbox') !== bbox) fail(page.url(), 'a filter change dropped the map area (bbox)');
      const s = await state(page);
      const out = s.ids.filter((id) => !inBox(id, box()));
      if (out.length) fail(page.url(), `with a filter, ${out.length} card(s) lie outside the area`);
      const want = params(page).get('offerType');
      const wrong = s.ids.filter((id) => byId.get(id) && byId.get(id).offer_type !== want);
      if (wrong.length) fail(page.url(), `${wrong.length} card(s) do not match offerType=${want} inside the area`);
    }

    // 4. Nothing in view: the area's empty state, markers kept.
    ran++;
    const sea = at('?view=map&map=8/0/-30&bbox=-1,-31,1,-29');
    await page.goto(`${base}${sea}`, { waitUntil: 'load' });
    await W(600);
    const z = await state(page);
    if (z.empty !== 'area') fail(sea, `an area without listings shows no [data-rs-empty="area"] (got ${z.empty})`);
    if (num(z.count) !== 0) fail(sea, `an area without listings counts "${z.count}"`);
    if (!z.markers) fail(sea, 'an empty area removed the markers (they must stay to pan to them)');
    for (const e of errors) fail(at('?view=map'), `page error: ${e.slice(0, 160)}`);
  } catch (e) {
    fail(at('?view=map'), `map test stopped: ${String(e).slice(0, 200)}`);
  } finally {
    await ctx.close();
  }
  return ran;
}

/** The agency fixture in `<siteDir>/src/data/` (SITES_FIXTURE picks one), or null. */
export function loadData(siteDir) {
  const dir = new URL('src/data/', siteDir);
  const wanted = process.env.SITES_FIXTURE;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    if (d?.organisation && Array.isArray(d.listings) && (!wanted || f === `${wanted}.json`)) return d;
  }
  return null;
}

// Standalone: `sites-kit test map [--url http://localhost:4321] [--path /listings]`.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const opt = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
  const base = opt('url', `http://localhost:${process.env.PORT ?? 4321}`).replace(/\/$/, '');
  const { chromium } = await import('playwright');
  let data = null;
  try { data = loadData(pathToFileURL(`${process.cwd()}/`)); } catch {}
  const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
  const problems = [];
  const ran = await checkSearchMap({ browser, base, path: opt('path', '/listings'), data, fail: (p, m) => problems.push(`${p}: ${m}`) });
  await browser.close();
  for (const p of problems) console.log(`FAIL ${p}`);
  console.log(problems.length ? `test:map: ${problems.length} problem(s) in ${ran} checks` : `test:map OK (${ran} checks)`);
  process.exit(problems.length ? 1 : 0);
}
