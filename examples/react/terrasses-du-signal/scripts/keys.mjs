// Keyboard checks: skip link, focus ring, phone menu (open, Escape), gallery lightbox (open, arrows, Escape),
// units page filters and sort (in place, URL kept).
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4512';
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
await desk.evaluate(() => scrollTo(0, 400));
await desk.waitForTimeout(200);
ok(await desk.evaluate(() => document.querySelector('[data-header]').classList.contains('is-solid')), 'home header turns solid on scroll');

await desk.goto(base + '/galerie');
await desk.focus('#photo-1');
await desk.keyboard.press('Enter');
ok(await desk.evaluate(() => document.querySelector('[data-dialog]').open), 'Enter on a photo opens the lightbox');
const n = await desk.textContent('[data-dialog] [data-count]');
await desk.keyboard.press('ArrowRight');
ok((await desk.textContent('[data-dialog] [data-count]'))?.startsWith('2 /'), `ArrowRight goes to photo 2 (${n} -> ${await desk.textContent('[data-dialog] [data-count]')})`);
await desk.keyboard.press('Escape');
ok(await desk.evaluate(() => !document.querySelector('[data-dialog]').open && document.activeElement?.id === 'photo-1'), 'Escape closes the lightbox, focus back on the opener');

await desk.goto(base + '/appartements', { waitUntil: 'networkidle' });
ok(await desk.evaluate(() => document.documentElement.classList.contains('js') && getComputedStyle(document.querySelector('[data-apply]')).display === 'none'), 'units script runs (apply button hidden)');
await desk.check('input[name=pieces][value="3.5"]');
await desk.check('input[name=dispo]');
await desk.waitForTimeout(100);
const st = await desk.evaluate(() => ({ shown: [...document.querySelectorAll('[data-row]')].filter((r) => !r.classList.contains('hide')).length, dim: document.querySelectorAll('[data-unit].dim').length, count: document.querySelector('[data-count]').textContent, url: location.search }));
ok(st.shown === Number(st.count) && st.shown > 0 && st.dim > 0 && st.url === '?pieces=3.5&dispo=1', `filters apply in place (${JSON.stringify(st)})`);
await desk.click('[data-sort=prix]');
const prices = await desk.evaluate(() => [...document.querySelectorAll('[data-row]')].map((r) => r.dataset.kPrix).filter(Boolean).map(Number));
ok(prices.every((p, i) => !i || prices[i - 1] <= p) && prices.length > 0, `sort by price ascending (${prices.length} prices)`);
ok((await desk.evaluate(() => location.search)).includes('tri=prix'), 'sort kept in the URL');

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
