// The critic calibration's scorer (tools/critic-calibrate.mjs): reading scores
// from a critic answer, and checking them against a case's expectations.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { checkCase, parseScores } from '../tools/critic-calibrate.mjs';

const answer = `# Critic: /, round 1

## Anchor
- calm

## Scores
1. First impression 2: the name reads at once.
2. Hierarchy 2: one focal point.
3. Proportion 1: the masthead is 136px.
4. Colour restraint 2: neutrals.
5. Typography 2: two families.
6. Type and logo 0: logo = heavy, condensed, grotesk, technical; Newsreader = regular, normal, serif, warm.
7. Section rhythm 2: 130px everywhere.
8. Grid and alignment 2: one grid.
9. Consistency 2: one system.
10. Hero image 2: the best photo.
11. Photo sharpness and tone 1: density 0.8.
12. Phone 2: designed.
13. Brand fit 1: could be any agency.

Total: 21/26

## Fixes (biggest first)
1. 3: logo 136px -> 60px
`;

test('parses the thirteen scores and the total', () => {
  const s = parseScores(answer);
  assert.equal(Object.keys(s.lines).length, 13);
  assert.deepEqual([s.lines[3], s.lines[6], s.lines[11], s.lines[13]], [1, 0, 1, 1]);
  assert.equal(s.total, 21);
  assert.equal(s.outOf, 26);
  // The fixes list (also "1. 3: ...") is not read as a score.
  assert.equal(s.lines[1], 2);
});

test('checks a case against its expectations', () => {
  const s = parseScores(answer);
  assert.deepEqual(checkCase(s, { 3: { max: 1 } }), []);
  assert.deepEqual(checkCase(s, { 6: { max: 1 }, total: { max: 22 } }), []);
  assert.deepEqual(checkCase(s, { all: { min: 1 } }), ['line 6: 0, expected at least 1']);
  assert.deepEqual(checkCase(s, { total: { min: 22 } }), ['total 21, expected at least 22']);
  assert.deepEqual(checkCase({ lines: {}, total: 0 }, { 4: { max: 1 } }), ['line 4: no score found']);
});

test('every calibration case has an existing inject file and an expectation', () => {
  const dir = new URL('../critic/calibration/', import.meta.url);
  const { cases } = JSON.parse(readFileSync(new URL('cases.json', dir), 'utf8'));
  assert.ok(cases.length >= 5);
  for (const c of cases) {
    assert.ok(Object.keys(c.expect).length, c.id);
    if (c.inject) assert.ok(readFileSync(new URL(c.inject, dir), 'utf8').length > 20, c.inject);
  }
});
