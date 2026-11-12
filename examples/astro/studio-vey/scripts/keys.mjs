// Keyboard checks: skip link, focus ring, mobile menu (open, Escape), lightbox (open, arrows, Escape).
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4411';
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
const listing = new URL(sitemap.match(/<loc>([^<]*\/objekte\/[^<]+)<\/loc>/)[1]).pathname;
await desk.goto(base + listing);
await desk.focus('.gal-main');
await desk.keyboard.press('Enter');
ok(await desk.evaluate(() => document.querySelector('[data-lightbox]').open), 'Enter on gallery opens lightbox');
await desk.waitForTimeout(300);
await desk.keyboard.press('ArrowRight');
await desk.waitForTimeout(1200);
ok((await desk.textContent('[data-lb-index]')) === '2', 'ArrowRight goes to photo 2');
await desk.keyboard.press('Escape');
ok(await desk.evaluate(() => !document.querySelector('[data-lightbox]').open), 'Escape closes lightbox');

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(base + '/');
await phone.focus('[data-menu-toggle]');
await phone.keyboard.press('Enter');
ok(await phone.evaluate(() => document.querySelector('[data-menu]').classList.contains('is-open') && getComputedStyle(document.querySelector('[data-menu]')).visibility === 'visible'), 'menu opens with Enter');
ok(await phone.evaluate(() => document.activeElement?.closest('[data-menu]') != null), 'focus moves into the menu');
await phone.keyboard.press('Escape');
await phone.waitForTimeout(400);
ok(await phone.evaluate(() => !document.querySelector('[data-menu]').classList.contains('is-open') && document.activeElement?.hasAttribute('data-menu-toggle')), 'Escape closes menu, focus back on button');
ok(await phone.evaluate(() => getComputedStyle(document.querySelector('[data-menu]')).visibility === 'hidden'), 'closed menu is visibility hidden');
await browser.close();
