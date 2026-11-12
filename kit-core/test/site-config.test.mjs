import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeSiteConfig } from '../site-config.mjs';
import { gateWranglerConfig } from '../tools/check-deploy.mjs';

describe('site.json', () => {
  test('defaults', () => {
    assert.deepEqual(normalizeSiteConfig({}), {
      country: 'CH',
      locale: 'fr-CH',
      locales: ['fr-CH'],
      developmentsPath: '/developments',
      redirects: {},
    });
  });
  test('country follows the locale, the default locale comes first', () => {
    const c = normalizeSiteConfig({ locale: 'es-ES', locales: ['en-GB', 'es-ES'] });
    assert.equal(c.country, 'ES');
    assert.deepEqual(c.locales, ['es-ES', 'en-GB']);
  });
  test('refuses what the kit cannot serve, naming the field', () => {
    assert.throws(() => normalizeSiteConfig({ locale: 'french' }), /locale/);
    assert.throws(() => normalizeSiteConfig({ country: 'DE' }), /country/);
    assert.throws(() => normalizeSiteConfig({ redirects: { '/a': 'https://evil.example' } }), /redirect/);
    assert.throws(() => normalizeSiteConfig({ redirects: { '/a': '//evil.example' } }), /redirect/);
    assert.throws(() => normalizeSiteConfig([]), /object/);
  });
  test('a development path in the site language', () => {
    assert.equal(normalizeSiteConfig({ developmentsPath: '/réalisations/' }).developmentsPath, '/réalisations');
  });
});

describe('the publish gate', () => {
  test('serves dist/ whatever the site wrangler config points at', () => {
    const root = mkdtempSync(join(tmpdir(), 'gate-'));
    writeFileSync(
      join(root, 'wrangler.jsonc'),
      '{\n  // decoy\n  "main": "./decoy/index.js",\n  "assets": { "directory": "./decoy" },\n  "compatibility_date": "2025-10-01",\n  "compatibility_flags": ["nodejs_compat"],\n}',
    );
    const c = gateWranglerConfig(root);
    assert.equal(c.main, join(root, 'dist/_worker.js/index.js'));
    assert.equal(c.assets.directory, join(root, 'dist'));
    assert.equal(c.compatibility_date, '2025-10-01');
    assert.deepEqual(c.compatibility_flags, ['nodejs_compat']);
  });
});
