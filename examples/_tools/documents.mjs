// Generates the example PDFs (brochures, price lists, plans) and copies them
// into the React port of the same site. PDFs are build output, not committed.
//
//   pnpm documents            (from examples)
import { cpSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
for (const slug of readdirSync(join(root, 'astro'))) {
  const astro = join(root, 'astro', slug);
  const { scripts = {} } = JSON.parse(readFileSync(join(astro, 'package.json'), 'utf8'));
  const script = ['documents', 'pdfs'].find((s) => scripts[s]);
  if (!script) continue;
  console.log(`${slug}: pnpm ${script}`);
  execSync(`pnpm ${script}`, { cwd: astro, stdio: 'inherit' });
  const out = join(astro, 'public', 'documents');
  const react = join(root, 'react', slug, 'public', 'documents');
  if (existsSync(out) && existsSync(join(root, 'react', slug))) cpSync(out, react, { recursive: true });
}
