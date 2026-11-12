#!/usr/bin/env node
/**
 * Keyboard check: skip link first, visible focus on the first tab stops,
 * phone menu opens with Enter, closes with Escape, and the units filter
 * checkbox works with Space.
 *   node scripts/keys.mjs [--base http://localhost:4522]
 */
import { chromium } from 'playwright';
const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:4522';
const b = await chromium.launch();
const out = [];
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base + '/');
const stops = [];
for (let i = 0; i < 12; i++) {
  await p.keyboard.press('Tab');
  stops.push(await p.evaluate(() => {
    const e = document.activeElement;
    const s = getComputedStyle(e);
    return { t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30), ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 };
  }));
}
out.push(`skip link first: ${/Inhalt/.test(stops[0].t)}`);
out.push(`tab stops with visible ring: ${stops.filter((s) => s.ring).length}/${stops.length} (${stops.map((s) => s.t).join(' | ')})`);
await p.goto(base + '/neubau/dorenbachhof');
await p.focus('#only-available');
await p.keyboard.press('Space');
const visible = await p.$$eval('.ut tbody tr', (rs) => rs.filter((r) => getComputedStyle(r).display !== 'none').length);
out.push(`units filter via Space: ${visible} rows visible (expect 9)`);
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(base + '/');
await m.focus('.hd__burger');
await m.keyboard.press('Enter');
const open = await m.$eval('#hd-menu', (e) => e.matches(':popover-open'));
await m.keyboard.press('Escape');
const closed = await m.$eval('#hd-menu', (e) => !e.matches(':popover-open'));
out.push(`phone menu: opens with Enter ${open}, closes with Escape ${closed}`);
console.log(out.join('\n'));
await b.close();
