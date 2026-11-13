#!/usr/bin/env node
/**
 * Calibrate the taste critic (TASTE.md section 5): does it still catch every
 * fault a user once had to point out, and leave the clean example alone?
 *
 *   sites-kit critic calibrate prepare --url http://localhost:4511 [--out critic-calibration]
 *       one critic-input/ folder per case in critic/calibration/cases.json,
 *       for the example running at --url (the anchor is the same page, clean)
 *   (the run harness gives each <out>/<case>/INDEX.md to the critic and saves
 *    its answer as <out>/<case>/answer.md)
 *   sites-kit critic calibrate score [--out critic-calibration]
 *       compares every answer.md with the case's expected scores; exit 1 on a miss
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Scores from a critic answer: { lines: { 1: 2, ... }, total }. */
export function parseScores(md) {
  const lines = {};
  const section = md.split(/^## Scores\s*$/m)[1]?.split(/^## /m)[0] ?? md;
  for (const m of section.matchAll(/^\s*(\d{1,2})\.\s+[^\n]*?\s([012])\s*:/gm)) lines[Number(m[1])] = Number(m[2]);
  const t = md.match(/Total:\s*(\d+)\s*\/\s*(\d+)/);
  const sum = Object.values(lines).reduce((a, b) => a + b, 0);
  return { lines, total: t ? Number(t[1]) : sum, outOf: t ? Number(t[2]) : null };
}

/** Problems of one case's scores against its expectations ([] = pass). */
export function checkCase(scores, expect) {
  const out = [];
  const test = (name, v, e) => {
    if (v === undefined) return out.push(`line ${name}: no score found`);
    if (e.min !== undefined && v < e.min) out.push(`line ${name}: ${v}, expected at least ${e.min}`);
    if (e.max !== undefined && v > e.max) out.push(`line ${name}: ${v}, expected at most ${e.max}`);
  };
  for (const [k, e] of Object.entries(expect)) {
    if (k === 'total') {
      if (e.min !== undefined && scores.total < e.min) out.push(`total ${scores.total}, expected at least ${e.min}`);
      if (e.max !== undefined && scores.total > e.max) out.push(`total ${scores.total}, expected at most ${e.max}`);
    } else if (k === 'all') {
      for (const [n, v] of Object.entries(scores.lines)) test(n, v, e);
    } else test(k, scores.lines[Number(k)], e);
  }
  return out;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const opt = (name, def) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? def : args.splice(i, 2)[1];
  };
  const OUT = resolve(opt('out', 'critic-calibration'));
  const URL_ = opt('url', '');
  const dir = fileURLToPath(new URL('../critic/calibration/', import.meta.url));
  const { cases } = JSON.parse(readFileSync(join(dir, 'cases.json'), 'utf8'));
  const cmd = args[0];
  if (cmd === 'prepare') {
    if (!URL_) {
      console.error('--url: the example of the cases running (e.g. studio-vey: pnpm --dir examples/react/studio-vey dev)');
      process.exit(2);
    }
    for (const c of cases) {
      const out = join(OUT, c.id);
      const inject = c.inject ? ['--inject', join(dir, c.inject)] : [];
      const run = spawnSync(process.execPath, [fileURLToPath(new URL('./critic.mjs', import.meta.url)), c.path, '--url', URL_, '--anchor', URL_, '--anchor-path', c.path, '--out', out, ...inject], { stdio: 'inherit' });
      if (run.status) process.exit(run.status);
    }
    console.log(`\n${cases.length} cases in ${OUT}/. Give each <case>/INDEX.md to the critic (a separate model, nothing else), save its answer as <case>/answer.md, then run: sites-kit critic calibrate score`);
  } else if (cmd === 'score') {
    let misses = 0;
    const report = [];
    for (const c of cases) {
      const f = join(OUT, c.id, 'answer.md');
      if (!existsSync(f)) {
        misses++;
        console.log(`✗ ${c.id}: no answer.md`);
        continue;
      }
      const scores = parseScores(readFileSync(f, 'utf8'));
      const problems = checkCase(scores, c.expect);
      if (problems.length) misses++;
      report.push({ id: c.id, fault: c.fault, scores, problems });
      console.log(`${problems.length ? '✗' : '✓'} ${c.id} (${c.fault}): total ${scores.total}${scores.outOf ? `/${scores.outOf}` : ''}${problems.map((p) => `\n    ${p}`).join('')}`);
    }
    writeFileSync(join(OUT, 'score.json'), JSON.stringify(report, null, 2));
    console.log(`\n${cases.length - misses}/${cases.length} cases pass.`);
    process.exit(misses ? 1 : 0);
  } else {
    console.error('Usage: sites-kit critic calibrate prepare --url <example url> | score  [--out dir]');
    process.exit(2);
  }
}
