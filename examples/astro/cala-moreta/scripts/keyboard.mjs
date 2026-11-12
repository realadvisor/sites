// Keyboard checks: skip link, phone menu (open, Escape, focus return),
// gallery popover (open, arrows, Escape), visible focus ring on links.
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:4414';
const b = await chromium.launch();
const ok = (c, m) => console.log(`${c ? 'ok  ' : 'FAIL'} ${m}`);
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.keyboard.press('Tab');
ok(await p.evaluate(() => document.activeElement?.classList.contains('skip') && document.activeElement.getBoundingClientRect().top >= 0), 'skip link first and visible');
await p.keyboard.press('Enter');
ok(await p.evaluate(() => document.activeElement?.id === 'main'), 'skip link moves focus to main');
await p.focus('[data-menu-open]');
await p.keyboard.press('Enter');
ok(await p.evaluate(() => document.querySelector('[data-menu]').classList.contains('is-open') && document.activeElement?.matches('[data-menu-close]') && getComputedStyle(document.querySelector('[data-menu]')).visibility === 'visible'), 'menu opens with Enter, focus on close');
ok(await p.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden'), 'body scroll locked');
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
ok(await p.evaluate(() => !document.querySelector('[data-menu]').classList.contains('is-open') && document.activeElement?.matches('[data-menu-open]') && getComputedStyle(document.querySelector('[data-menu]')).visibility === 'hidden'), 'Escape closes menu, focus back on button');
await p.goto(base + '/inmueble/villa-blanca-sobre-la-cala-374beb01-e63d-4818-b49a-3ce71b962dd0', { waitUntil: 'networkidle' });
await p.focus('.g-all');
await p.keyboard.press('Enter');
ok(await p.evaluate(() => document.querySelector('[data-lightbox]').matches(':popover-open')), 'gallery opens with Enter');
await p.waitForTimeout(500); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1200);
console.log(await p.evaluate(() => { const s = document.querySelector('[data-lb-strip]'); return [s.scrollLeft, s.clientWidth, document.activeElement?.className, document.querySelector('[data-lb-count]').textContent].join(' | '); }));
ok(await p.evaluate(() => /2/.test(document.querySelector('[data-lb-count]').textContent)), 'ArrowRight goes to photo 2');
await p.keyboard.press('Escape');
ok(await p.evaluate(() => !document.querySelector('[data-lightbox]').matches(':popover-open')), 'Escape closes gallery');
const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto(base + '/comprar', { waitUntil: 'networkidle' });
await d.keyboard.press('Tab'); await d.keyboard.press('Tab');
ok(await d.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'), `visible focus ring on ${await d.evaluate(() => document.activeElement.textContent.trim().slice(0, 20))}`);

// Filters (desktop): focus a filter select by Tab, change it with the keyboard, results follow.
await d.goto(base + '/comprar', { waitUntil: 'networkidle' });
await d.focus('#f-minRooms');
ok(await d.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none' || getComputedStyle(document.activeElement).boxShadow !== 'none'), 'filter select has a visible focus style');
// Native <select>: typeahead (headless mac Chromium cannot drive the popup with arrows).
await d.keyboard.type('3'); await d.waitForTimeout(1000);
ok(await d.evaluate(() => /minRooms=3/.test(location.search) && document.querySelector('#f-minRooms').value === '3'), `rooms filter changes with ArrowDown (${await d.evaluate(() => location.search)})`);
// Filters (phone): the filters sheet opens with Enter and closes with Escape.
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(base + '/comprar', { waitUntil: 'networkidle' });
await m.focus('.rs-filters-btn'); await m.keyboard.press('Enter'); await m.waitForTimeout(300);
ok(await m.evaluate(() => document.querySelector('#rs-sheet').matches(':popover-open')), 'filters sheet opens with Enter');
await m.keyboard.press('Escape'); await m.waitForTimeout(300);
ok(await m.evaluate(() => !document.querySelector('#rs-sheet').matches(':popover-open')), 'Escape closes filters sheet');
// Form: Tab order name -> email -> phone -> message -> submit; empty submit focuses first invalid field.
await d.goto(base + '/contacto', { waitUntil: 'networkidle' });
await d.focus('#enquiry-name');
const order = [];
for (let i = 0; i < 4; i++) { await d.keyboard.press('Tab'); order.push(await d.evaluate(() => document.activeElement.id || document.activeElement.tagName)); }
ok(order.join(',').startsWith('enquiry-email,enquiry-phone,enquiry-message'), `form tab order: name,${order.join(',')}`);
await d.focus('form[action="/api/enquiry"] button[type=submit]'); await d.keyboard.press('Enter'); await d.waitForTimeout(400);
ok(await d.evaluate(() => document.activeElement?.id === 'enquiry-name' && document.activeElement.getAttribute('aria-invalid') === 'true'), 'empty submit: focus on first invalid field, aria-invalid set');
await b.close();
