#!/usr/bin/env node
/** Keyboard checks: skip link, focus ring, search tabs (arrow keys, CSS panels), stacking-plan filter, phone menu (popover: open, scroll lock, Escape). */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:4513';
const b = await chromium.launch();
const ok = (c, m) => console.log(`${c ? 'PASS' : 'FAIL'} ${m}`);

let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.keyboard.press('Tab');
const skip = await p.evaluate(() => ({ cls: document.activeElement?.className, top: document.activeElement?.getBoundingClientRect().top }));
ok(String(skip.cls).includes('skip') && skip.top >= 0, 'first Tab focuses the visible skip link');
const outline = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
ok(outline !== 'none', `focus ring visible (${outline})`);
await p.keyboard.press('Enter');
ok(await p.evaluate(() => location.hash === '#main'), 'skip link goes to #main');
await p.focus('#sb-buy');
await p.keyboard.press('ArrowRight');
const tab = await p.evaluate(() => document.querySelector('input[name="sb-intent"]:checked')?.id);
const shown = await p.evaluate(() => [...document.querySelectorAll('.sb__panel')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.className));
ok(tab === 'sb-rent' && shown.join().includes('rent'), `arrow key moves the search tab (${tab}, ${shown})`);
await p.goto(base + '/neuf/les-rives-de-bellerive', { waitUntil: 'networkidle' });
await p.focus('.sp__toggle');
await p.keyboard.press('Space');
ok(await p.evaluate(() => [...document.querySelectorAll('.sp tbody tr:not(.st-available)')].every((r) => getComputedStyle(r).display === 'none')), 'Space on "only available" hides the other units');
await p.close();

p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(base + '/de', { waitUntil: 'networkidle' });
await p.focus('.hd__burger');
await p.keyboard.press('Enter');
ok(await p.evaluate(() => document.querySelector('#hd-menu').matches(':popover-open')), 'menu opens from the keyboard');
ok(await p.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'), 'body scroll locked while open');
await p.keyboard.press('Escape');
ok(await p.evaluate(() => !document.querySelector('#hd-menu').matches(':popover-open')), 'Escape closes the menu');
await b.close();
