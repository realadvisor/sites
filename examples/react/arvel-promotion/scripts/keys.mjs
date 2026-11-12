// Keyboard checks: skip link, focus ring, mobile menu (open, Escape), gallery lightbox (open, arrows, Escape, focus return).
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4516';
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

await desk.goto(base + '/programmes/le-clos-des-tilleuls/galerie');
await desk.focus('[data-gallery="programme"] a[data-lightbox]');
await desk.keyboard.press('Enter');
ok(await desk.evaluate(() => document.querySelector('[data-lightbox-dialog]').open), 'Enter on a photo opens the lightbox');
const cap1 = await desk.textContent('[data-lb-cap]');
await desk.keyboard.press('ArrowRight');
const cap2 = await desk.textContent('[data-lb-cap]');
ok(/ 1 \//.test(cap1) && / 2 \//.test(cap2), `ArrowRight goes to photo 2 (${cap2?.slice(-8)})`);
await desk.keyboard.press('Escape');
ok(await desk.evaluate(() => !document.querySelector('[data-lightbox-dialog]').open), 'Escape closes the lightbox');
ok(await desk.evaluate(() => document.activeElement?.matches('[data-gallery="programme"] a[data-lightbox]')), 'focus returns to the photo');

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(base + '/');
await phone.focus('[data-menu-open]');
await phone.keyboard.press('Enter');
await phone.waitForTimeout(400);
ok(await phone.evaluate(() => document.querySelector('[data-header]').classList.contains('is-open') && getComputedStyle(document.querySelector('[data-menu]')).visibility === 'visible'), 'menu opens with Enter');
ok(await phone.evaluate(() => document.activeElement?.closest('[data-menu]') != null), 'focus moves into the menu');
ok(await phone.evaluate(() => document.documentElement.classList.contains('menu-lock')), 'page scroll locked');
await phone.keyboard.press('Escape');
await phone.waitForTimeout(400);
ok(await phone.evaluate(() => !document.querySelector('[data-header]').classList.contains('is-open') && document.activeElement?.hasAttribute('data-menu-open')), 'Escape closes menu, focus back on button');
ok(await phone.evaluate(() => getComputedStyle(document.querySelector('[data-menu]')).visibility === 'hidden'), 'closed menu is visibility hidden');
await browser.close();
