// Keyboard checks: skip link, focus ring, mobile menu (open, focus trap, Escape), gallery lightbox (open, arrows, Escape).
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4515';
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

await desk.goto(base + '/galerie', { waitUntil: 'networkidle' });
await desk.focus('[data-lightbox="0"]');
await desk.keyboard.press('Enter');
ok(await desk.evaluate(() => document.querySelector('[data-lb]').open), 'Enter on a gallery tile opens the lightbox');
const first = await desk.textContent('[data-lb-count]');
await desk.keyboard.press('ArrowRight');
const second = await desk.textContent('[data-lb-count]');
ok(first?.startsWith('1 /') && second?.startsWith('2 /'), `ArrowRight goes to photo 2 (${first} -> ${second})`);
await desk.keyboard.press('Escape');
ok(await desk.evaluate(() => !document.querySelector('[data-lb]').open), 'Escape closes the lightbox');
ok(await desk.evaluate(() => document.activeElement?.getAttribute('data-lightbox') === '0'), 'focus returns to the tile');

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(base + '/');
await phone.focus('[data-menu-open]');
await phone.keyboard.press('Enter');
await phone.waitForTimeout(300);
ok(await phone.evaluate(() => document.querySelector('[data-menu]').classList.contains('is-open') && getComputedStyle(document.querySelector('[data-menu]')).visibility === 'visible'), 'menu opens with Enter');
ok(await phone.evaluate(() => document.activeElement?.closest('[data-menu]') != null), 'focus moves into the menu');
await phone.keyboard.press('Shift+Tab');
ok(await phone.evaluate(() => document.activeElement?.closest('[data-menu]') != null), 'Shift+Tab stays inside the menu');
await phone.keyboard.press('Escape');
await phone.waitForTimeout(400);
ok(await phone.evaluate(() => !document.querySelector('[data-menu]').classList.contains('is-open') && document.activeElement?.hasAttribute('data-menu-open')), 'Escape closes menu, focus back on button');
ok(await phone.evaluate(() => getComputedStyle(document.querySelector('[data-menu]')).visibility === 'hidden'), 'closed menu is visibility hidden');
await browser.close();
