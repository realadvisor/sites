#!/usr/bin/env node
/**
 * `pnpm preview`: serves build/ with `wrangler dev` (build/server/wrangler.json)
 * and restarts it when a new build lands. Plain `wrangler dev --config
 * build/server/wrangler.json` keeps serving the build it started with:
 * `react-router build` replaces build/ and wrangler does not see it.
 *
 *   sites-kit-react preview [--port 4522] [other wrangler dev flags]
 */
import { spawn } from 'node:child_process';
import { existsSync, statSync, watchFile } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const config = join(root, 'build/server/wrangler.json');
const stamp = () => {
  try {
    return [config, join(root, 'build/server/index.js')].map((f) => statSync(f).mtimeMs).join(':');
  } catch {
    return '';
  }
};
if (!existsSync(config)) {
  console.error('sites-kit-react preview: no build/server/wrangler.json: run `pnpm build` first');
  process.exit(1);
}

const wrangler = join(root, 'node_modules/.bin/wrangler');
const kill = () => {
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
};
let child;
let last = stamp();
let stopping = false;
const start = () => {
  // Its own process group: a restart or a stop takes wrangler and workerd down with it.
  child = spawn(wrangler, ['dev', '--config', 'build/server/wrangler.json', ...args], { stdio: 'inherit', cwd: root, detached: true });
  child.on('exit', (code) => {
    if (!stopping && !restarting) process.exit(code ?? 0);
  });
};
let restarting = false;
let timer;
const check = () => {
  const now = stamp();
  if (!now || now === last) return;
  // Wait for the build to finish writing (the server build comes last).
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (stamp() !== now) return check();
    last = now;
    console.log('\n[sites-kit-react preview] new build: restarting wrangler');
    restarting = true;
    child.once('exit', () => {
      restarting = false;
      start();
    });
    kill();
  }, 800);
};
for (const f of [config, join(root, 'build/server/index.js')]) watchFile(f, { interval: 500 }, check);
const stop = () => {
  stopping = true;
  if (!child || child.exitCode != null) process.exit(0);
  child.once('exit', () => process.exit(0));
  kill();
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('SIGHUP', stop);
start();
