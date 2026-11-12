// The kit's HTML helpers (lib/html.ts) and its sample data (fixtures/), which
// is in the SDK's Fixture shape: the records as /v3/public answers them.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { htmlToText, looksLikeMarkdown, markdownToHtml, richText, sanitizeHtml } from '../lib/html.ts';

const read = (f) => JSON.parse(readFileSync(new URL(`../fixtures/${f}`, import.meta.url), 'utf8'));
const fixtures = { 'demo-agency.json': read('demo-agency.json'), 'development-residence-exemple.json': read('development-residence-exemple.json') };

test('sanitizes description HTML to the allowlist', () => {
  const dirty =
    '<div class="x" onclick="evil()"><b>Vue</b> lac<script>alert(1)</script><img src=x onerror=alert(1)></div>' +
    '<ul><li><a href="javascript:alert(1)">Cave</a><li>Jardin</ul><p style="color:red">A &amp; B &lt;i&gt;</p>';
  assert.equal(
    sanitizeHtml(dirty),
    '<p><strong>Vue</strong> lac</p><ul><li>Cave</li><li>Jardin</li></ul><p>A &amp; B &lt;i&gt;</p>',
  );
  assert.equal(htmlToText(dirty), 'Vue lac\n\nCave\nJardin\nA & B <i>');
});

test('markdown becomes HTML and clean text', () => {
  const md = '**Emplacement**\nAu cœur de Morges, à 5 min du lac.\n\n## Prestations\n- Parking\n- *Jardin* privatif\n\n1. Étape une';
  assert.ok(looksLikeMarkdown(md));
  assert.ok(!looksLikeMarkdown('<p>**not converted inside HTML**</p>'));
  assert.ok(!looksLikeMarkdown('Prix 3 * 4 pièces'));
  assert.equal(
    markdownToHtml(md),
    '<p><strong>Emplacement</strong><br>Au cœur de Morges, à 5 min du lac.</p><h3>Prestations</h3><ul><li>Parking</li><li><em>Jardin</em> privatif</li></ul><ol><li>Étape une</li></ol>',
  );
  const { text } = richText(md);
  assert.ok(!/[*#]/.test(text), text);
  assert.match(text, /^Emplacement\nAu cœur/);
  assert.equal(richText('<script>x</script>**a** <b>b</b>').html, '**a** <strong>b</strong>');
  assert.equal(markdownToHtml('**<img src=x onerror=alert(1)>**'), '<p><strong>&lt;img src=x onerror=alert(1)&gt;</strong></p>');
});

test('fixtures are SDK Fixtures: snake_case records, sanitized descriptions with their text', () => {
  const camel = [];
  const walk = (v, path) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) (/[A-Z]/.test(k) && camel.push(`${path}.${k}`), walk(x, `${path}.${k}`));
  };
  for (const [name, fx] of Object.entries(fixtures)) {
    walk(fx, name);
    assert.ok(fx.organisation?.id && fx.organisation.name, name);
    assert.ok(fx.teams.length && fx.teams[0].primary, `${name}: a primary team first`);
    const records = [...fx.teams, ...fx.listings, ...(fx.developments ?? []), ...(fx.developments ?? []).flatMap((d) => d.units)];
    for (const r of records.filter((x) => x.description)) {
      assert.doesNotMatch(r.description, /<(?!\/?(p|br|ul|ol|li|strong|em|h3|h4)>)/, `${name} ${r.id}`);
      assert.ok(r.description_text && !r.description_text.includes('<'), `${name} ${r.id}: description_text`);
    }
    for (const l of fx.listings) {
      assert.ok(Array.isArray(l.photos) && Array.isArray(l.features) && Array.isArray(l.team_ids) && l.published_at, `${name} ${l.id}`);
    }
    for (const a of fx.agents) assert.ok(a.first_name && Array.isArray(a.team_ids), `${name} ${a.id}`);
  }
  assert.deepEqual(camel, []);
});
