// Keyboard checks: skip link, focus ring, mobile menu (open, Escape), lightbox on a unit page (open, arrows, Escape),
// the drawing linked to the table (focus a row lights its segment), unit page drawing links, stars and compare.
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4519';
const browser = await chromium.launch();
const ok = (c, m) => console.log(`${c ? 'PASS' : 'FAIL'} ${m}`);

const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desk.goto(base + '/');
await desk.keyboard.press('Tab');
ok(await desk.evaluate(() => document.activeElement?.classList.contains('skip')), 'first Tab lands on skip link');
await desk.keyboard.press('Enter');
ok(await desk.evaluate(() => location.hash === '#main'), 'skip link goes to #main');
await desk.keyboard.press('Tab');
const outline = await desk.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
ok(outline !== 'none', `focus ring visible (${outline})`);

// Units: focus on a row's link lights the same unit in the drawing; filters apply on change.
await desk.goto(base + '/appartamenti');
await desk.focus('tr[data-unit] .c-no a');
const id = await desk.evaluate(() => document.activeElement.closest('tr').dataset.unit);
ok(await desk.evaluate((id) => document.querySelector(`[data-iso] [data-unit="${id}"]`)?.classList.contains('is-hot'), id), 'row focus lights its drawing segment');
await desk.selectOption('select[name=rooms]', '3.5');
await desk.waitForTimeout(200);
ok(await desk.evaluate(() => location.search === '?rooms=3.5' && [...document.querySelectorAll('tr[data-unit]')].every((r) => r.hidden === (r.dataset.rooms !== '3.5'))), 'rooms filter applies in place, URL follows');
await desk.goto(base + '/appartamenti');
await desk.evaluate(() => localStorage.clear());
await desk.reload();
await desk.click('tr[data-unit] .star');
await desk.waitForTimeout(100);
ok(await desk.evaluate(() => !document.querySelector('[data-shortlist]').hidden && !document.querySelector('[data-fav-link]').hidden), 'star shows the shortlist bar and the header count');
await desk.click('[data-shortlist-compare]');
await desk.waitForLoadState('load');
ok(await desk.evaluate(() => /\/appartamenti\/confronto\?u=[0-9a-f]{8}$/.test(location.pathname + location.search) && document.querySelectorAll('thead th').length === 1), 'compare page shows the saved unit');

// Unit page: the other units in the drawing are links, this one is the current one; Tab reaches them.
const sitemap = await fetch(`${base}/sitemap.xml`).then((r) => r.text());
const unit = new URL(sitemap.match(/<loc>([^<]*\/appartamenti\/[^<]+)<\/loc>/)[1]).pathname;
await desk.goto(base + unit);
ok(await desk.evaluate(() => document.querySelectorAll('[data-iso] a.u').length > 0 && document.querySelectorAll('[data-iso] [aria-current=page]').length === 1), 'unit drawing: other units are links, this one current');
await desk.focus('[data-lightbox]');
await desk.keyboard.press('Enter');
ok(await desk.evaluate(() => document.querySelector('[data-dialog]').open), 'Enter on a photo opens the lightbox');
await desk.keyboard.press('ArrowRight');
await desk.waitForTimeout(200);
ok((await desk.textContent('[data-dialog] [data-count]'))?.startsWith('2 /'), 'ArrowRight goes to photo 2');
await desk.keyboard.press('Escape');
ok(await desk.evaluate(() => !document.querySelector('[data-dialog]').open && document.activeElement?.hasAttribute('data-lightbox')), 'Escape closes the lightbox, focus back on the photo');

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(base + '/');
await phone.focus('[data-menu-btn]');
await phone.keyboard.press('Enter');
ok(await phone.evaluate(() => document.querySelector('[data-menu]').classList.contains('is-open') && getComputedStyle(document.querySelector('[data-menu]')).visibility === 'visible'), 'menu opens with Enter');
ok(await phone.evaluate(() => document.activeElement?.closest('[data-menu]') != null), 'focus moves into the menu');
await phone.keyboard.press('Escape');
await phone.waitForTimeout(400);
ok(await phone.evaluate(() => !document.querySelector('[data-menu]').classList.contains('is-open') && document.activeElement?.hasAttribute('data-menu-btn')), 'Escape closes menu, focus back on button');
ok(await phone.evaluate(() => getComputedStyle(document.querySelector('[data-menu]')).visibility === 'hidden'), 'closed menu is visibility hidden');
await browser.close();
