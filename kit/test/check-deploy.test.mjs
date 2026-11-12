import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { unsafeHtml } from '../tools/check-deploy.mjs';

const flagged = (expr) => {
  const root = mkdtempSync(join(tmpdir(), 'ra-unsafe-html-'));
  mkdirSync(join(root, 'src/pages'), { recursive: true });
  writeFileSync(join(root, 'src/pages/index.astro'), `<div set:html={${expr}} />\n`);
  return unsafeHtml(root).length > 0;
};

test('unsafeHtml: allows a single sanitizeHtml or safeJsonLd call and literals', () => {
  for (const expr of ['sanitizeHtml(listing.description)', "sanitizeHtml(dev.description ?? '')", 'safeJsonLd(jsonLd)', "'<br>'", '`<hr>`']) {
    assert.equal(flagged(expr), false, expr);
  }
});

test('unsafeHtml: flags data, operators and method chains after the call', () => {
  for (const expr of ['listing.title', 'sanitizeHtml(a) + listing.title', "sanitizeHtml(x).replace('a', b)", 'safeJsonLd(a) + b', 'sanitizeHtml(md(x))']) {
    assert.equal(flagged(expr), true, expr);
  }
});
