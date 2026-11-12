#!/usr/bin/env node
/** Keyboard checks against the preview: skip link, phone menu (open, Escape), search tabs (arrow keys), carousel buttons. */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4413';
const b = await chromium.launch();
const ok = (c, m) => console.log(`${c ? 'ok  ' : 'FAIL'} ${m}`);

let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.keyboard.press('Tab');
const skip = await p.evaluate(() => ({ cls: document.activeElement?.className, top: document.activeElement?.getBoundingClientRect().top }));
ok(String(skip.cls).includes('skip') && skip.top >= 0, 'first Tab focuses the visible skip link');
const outline = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
ok(outline !== 'none', `focus ring visible (${outline})`);
await p.focus('#sb-buy');
await p.keyboard.press('ArrowRight');
const tab = await p.evaluate(() => document.querySelector('input[name="sb-intent"]:checked')?.id);
const shown = await p.evaluate(() => [...document.querySelectorAll('.sb__panel')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.className));
ok(tab === 'sb-rent' && shown.join().includes('rent'), `arrow key moves the search tab (${tab}, ${shown})`);
await p.focus('[data-car-next]');
await p.keyboard.press('Enter');
await p.waitForTimeout(700);
ok(await p.evaluate(() => document.querySelector('[data-car-track]').scrollLeft > 0), 'carousel next button scrolls with Enter');
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
