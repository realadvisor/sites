// Keyboard checks: skip link, focus ring, phone menu (open, Escape), gallery dialog (open, Escape),
// favourites (heart, count, /favoris list) and the payment estimate.
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4518';
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

const sitemap = await fetch(`${base}/sitemap.xml`).then((r) => r.text());
const listing = new URL(sitemap.match(/<loc>([^<]*\/annonces\/[^<]+)<\/loc>/)[1]).pathname;
await desk.goto(base + listing, { waitUntil: 'networkidle' });
await desk.focus('[data-gal-open="0"].gal__open');
await desk.keyboard.press('Enter');
ok(await desk.evaluate(() => document.querySelector('[data-gal-dialog]').open), 'Enter on the first photo opens the photo dialog');
await desk.waitForTimeout(200);
await desk.keyboard.press('Escape');
await desk.waitForTimeout(200);
ok(await desk.evaluate(() => !document.querySelector('[data-gal-dialog]').open && !document.body.classList.contains('is-locked')), 'Escape closes the dialog');
if (await desk.$('[data-pay]')) {
  const before = await desk.textContent('[data-pay-out]');
  await desk.fill('#pay-rate', '1');
  await desk.dispatchEvent('#pay-rate', 'input');
  ok((await desk.textContent('[data-pay-out]')) !== before, `payment estimate recomputes (${before} -> ${await desk.textContent('[data-pay-out]')})`);
}
await desk.focus('.save--label');
await desk.keyboard.press('Enter');
ok(await desk.evaluate(() => document.querySelector('.save--label').getAttribute('aria-pressed') === 'true'), 'Enter on "Enregistrer" saves the listing');
ok((await desk.textContent('[data-saved-count]')) === '1', 'header count shows 1');
await desk.goto(base + '/favoris', { waitUntil: 'networkidle' });
ok(await desk.evaluate(() => document.querySelectorAll('[data-saved-list] li').length === 1 && document.querySelector('[data-saved-empty]').hidden), '/favoris lists the saved listing');
await desk.goto(base + '/acheter?view=map', { waitUntil: 'networkidle' });
await desk.click('[data-save-search]');
ok((await desk.textContent('[data-save-search] [data-label]')) === 'Recherche enregistrée', 'search saved');

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(base + '/');
await phone.focus('[data-menu-btn]');
await phone.keyboard.press('Enter');
await phone.waitForTimeout(300);
ok(await phone.evaluate(() => document.querySelector('[data-menu]').classList.contains('is-open') && getComputedStyle(document.querySelector('[data-menu]')).visibility === 'visible'), 'menu opens with Enter');
ok(await phone.evaluate(() => document.activeElement?.closest('[data-menu]') != null), 'focus moves into the menu');
await phone.keyboard.press('Escape');
await phone.waitForTimeout(400);
ok(await phone.evaluate(() => !document.querySelector('[data-menu]').classList.contains('is-open') && document.activeElement?.hasAttribute('data-menu-btn')), 'Escape closes menu, focus back on button');
ok(await phone.evaluate(() => getComputedStyle(document.querySelector('[data-menu]')).visibility === 'hidden'), 'closed menu is visibility hidden');
await browser.close();
