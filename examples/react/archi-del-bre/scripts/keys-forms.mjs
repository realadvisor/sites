// Keyboard: the units filters (Tab through, change with keys, no reload) and the contact form (Tab order, focus ring, 10px corners, validation without submit).
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4519';
const ok = (c, m) => console.log(`${c ? 'PASS' : 'FAIL'} ${m}`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(base + '/de/wohnungen');
await p.focus('select[name=rooms]');
await p.keyboard.type('3'); // type-to-select: 3.5 Zimmer
await p.waitForTimeout(200);
ok(await p.evaluate(() => location.search.startsWith('?rooms=') && document.querySelector('[data-submit]').hidden), 'typing on Zimmer filters in place (submit hidden with JS)');
await p.keyboard.press('Tab');
ok(await p.evaluate(() => document.activeElement?.name === 'house'), 'Tab goes Zimmer -> Haus');
const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto(base + '/contatti');
await d.focus('#enquiry-name');
await d.waitForTimeout(300); // ring animates in (box-shadow transition)
const ring = await d.evaluate(() => getComputedStyle(document.activeElement).boxShadow);
ok(/ 3px$/.test(ring), `name field shows a 3px focus ring (${ring})`);
const radius = await d.evaluate(() => [...document.querySelectorAll('#enquiry .control')].map((e) => getComputedStyle(e).borderRadius));
ok(radius.every((r) => r === '10px'), `form fields have 10px corners, not pills (${[...new Set(radius)].join(',')})`);
await d.keyboard.type('Test');
await d.keyboard.press('Tab');
ok(await d.evaluate(() => document.activeElement?.id === 'enquiry-email'), 'Tab goes name -> e-mail');
await d.keyboard.press('Tab');
ok(await d.evaluate(() => document.activeElement?.id === 'enquiry-phone'), 'Tab goes e-mail -> phone');
await d.keyboard.press('Tab');
ok(await d.evaluate(() => document.activeElement?.id === 'enquiry-lot'), 'Tab goes phone -> unit');
const valid = await d.evaluate(() => document.querySelector('#enquiry-email').closest('form').checkValidity());
ok(!valid, 'form is invalid without e-mail/unit/message (nothing submitted)');
await b.close();
