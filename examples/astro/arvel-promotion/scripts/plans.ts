// Writes public/plans/t1.svg .. t5.svg from src/lib/plans.ts (the same drawing
// the lot pages render inline). Run: pnpm plans
import { mkdirSync, writeFileSync } from 'node:fs';
import { PLANS, nominalSurface, planTree, toSvg } from '../src/lib/plans.ts';

const dir = new URL('../public/plans/', import.meta.url);
mkdirSync(dir, { recursive: true });
const NAMES: Record<string, string> = { T1: 'Studio', T2: '2 pièces', T3: '3 pièces', T4: '4 pièces', T5: '5 pièces' };
for (const p of Object.values(PLANS)) {
  const m2 = Math.round(nominalSurface(p));
  const tree = planTree(p, {
    outdoor: { label: 'Balcon', surface: 10 },
    title: `Plan indicatif ${p.code} (${NAMES[p.code]}), environ ${m2} m²`,
    caption: `Plan indicatif ${p.code} · environ ${m2} m² · non contractuel`,
  });
  writeFileSync(new URL(`${p.code.toLowerCase()}.svg`, dir), `<?xml version="1.0" encoding="UTF-8"?>\n${toSvg(tree)}\n`);
  console.log(`public/plans/${p.code.toLowerCase()}.svg  ${m2} m²`);
}
