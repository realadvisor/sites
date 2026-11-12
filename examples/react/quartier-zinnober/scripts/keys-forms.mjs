// Keyboard: the units filter on /wohnungen (radios and selects apply instantly, URL updates, reset) and the contact form (Tab order, focus ring, validation without submit).
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4515';
const ok = (c, m) => console.log(`${c ? 'PASS' : 'FAIL'} ${m}`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base + '/wohnungen', { waitUntil: 'networkidle' });
ok(await p.evaluate(() => document.querySelector('[data-apply]').hidden), 'Anwenden button hidden with JS (instant filter)');
await p.focus('input[name=haus][value=""]');
await p.keyboard.press('ArrowRight'); // Haus A
await p.keyboard.press('ArrowRight'); // Haus B
await p.waitForTimeout(100);
ok(await p.evaluate(() => new URL(location.href).searchParams.get('haus') === 'B'), `arrow keys pick Haus B, URL ${await p.evaluate(() => location.search)}`);
ok(await p.evaluate(() => [...document.querySelectorAll('[data-building-panel]')].filter((e) => !e.hidden).map((e) => e.dataset.buildingPanel).join() === 'B'), 'only the Haus B plan shows');
await p.focus('input[name=frei]');
await p.keyboard.press('Space');
const n = await p.evaluate(() => [...document.querySelectorAll('[data-row]')].filter((r) => !r.hidden).length);
ok(Number(await p.textContent('[data-count]')) === n && n > 0, `count matches visible rows (${n})`);
const server = await (await fetch(`${base}/wohnungen?haus=B&frei=1`)).text();
ok((server.match(/data-row=""(?![^>]*hidden)/g) ?? []).length === n || server.includes(`>${n}</strong>`), 'server renders the same count without JS');
await p.click('[data-reset]');
ok(await p.evaluate(() => location.search === '' && [...document.querySelectorAll('[data-row]')].every((r) => !r.hidden)), 'Zurücksetzen clears filters and URL');

const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto(base + '/kontakt');
await d.focus('#kontakt-form-name');
await d.waitForTimeout(300); // ring animates in (box-shadow transition)
const ring = await d.evaluate(() => getComputedStyle(document.activeElement).outlineStyle + '/' + getComputedStyle(document.activeElement).boxShadow);
ok(/ 3px$/.test(ring) || !ring.startsWith('none'), `name field shows a focus ring (${ring})`);
await d.keyboard.type('Test');
await d.keyboard.press('Tab');
ok(await d.evaluate(() => document.activeElement?.id === 'kontakt-form-email'), 'Tab goes name -> e-mail');
await d.keyboard.press('Tab');
ok(await d.evaluate(() => document.activeElement?.id === 'kontakt-form-phone'), 'Tab goes e-mail -> phone');
await d.keyboard.press('Tab');
ok(await d.evaluate(() => document.activeElement?.id === 'kontakt-form-lot'), 'Tab goes phone -> unit select');
const valid = await d.evaluate(() => document.querySelector('#kontakt-form-email').closest('form').checkValidity());
ok(!valid, 'form is invalid without e-mail/message (nothing submitted)');
await b.close();
