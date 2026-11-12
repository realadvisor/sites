#!/usr/bin/env node
/**
 * The React kit's tools, run from the site root (the site's package scripts):
 *
 *   sites-kit-react check deploy [--no-build]   the deploy gate (pnpm check:deploy)
 *   sites-kit-react preview [--port N]         build/ on wrangler dev, restarted on each new build (pnpm preview)
 *
 * The other tools are the Astro kit's (`sites-kit screenshot --url …`,
 * `sites-kit test map --url …`): they drive a running site, whatever builds it.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOLS = { 'check deploy': 'check-deploy.mjs', preview: 'preview.mjs' };
const argv = process.argv.slice(2);
const one = TOOLS[argv[0]] && argv[0] === 'preview';
const [first, second, ...rest] = one ? [argv[0], undefined, ...argv.slice(1)] : argv;
const tool = one ? TOOLS.preview : TOOLS[`${first} ${second}`];
if (!tool) {
  console.error(`${first ? `Unknown command: ${[first, second].filter(Boolean).join(' ')}\n` : ''}Commands:\n${Object.keys(TOOLS).map((k) => `  sites-kit-react ${k}`).join('\n')}`);
  process.exit(first ? 2 : 0);
}
const child = spawn(process.execPath, [fileURLToPath(new URL(`../tools/${tool}`, import.meta.url)), ...rest], { stdio: 'inherit' });
// pnpm stops a script with a signal: pass it on, so `preview` takes wrangler down with it.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => child.kill(sig));
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
