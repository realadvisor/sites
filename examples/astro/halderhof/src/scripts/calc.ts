/**
 * Affordability calculator: recomputes the results on every input. The
 * server already rendered them for the default values, so without this
 * script the block still reads correctly.
 */
import { afford, chf, group, pct } from '../lib/afford';

const num = (el: HTMLInputElement) => Number(el.value.replace(/[^\d]/g, '')) || 0;

for (const root of document.querySelectorAll<HTMLElement>('[data-calc]')) {
  const locale = root.dataset.locale ?? 'de-CH';
  const input = (n: string) => root.querySelector<HTMLInputElement>(`[name="${n}"]`)!;
  const out = (n: string) => root.querySelector<HTMLElement>(`[data-out="${n}"]`)!;
  const [price, own, income] = [input('price'), input('own'), input('income')];
  const run = () => {
    const r = afford(num(price), num(own), num(income));
    out('mortgage').textContent = chf(r.mortgage);
    out('ltv').textContent = pct(r.ltv, locale);
    out('monthly').textContent = chf(r.monthly);
    out('share').textContent = pct(r.share, locale);
    const verdict = out('verdict');
    verdict.textContent = !r.ownOk ? root.dataset.ownLow! : r.ok ? root.dataset.ok! : root.dataset.no!;
    verdict.dataset.state = r.ok ? 'ok' : 'no';
  };
  for (const el of [price, own, income]) {
    el.addEventListener('input', run);
    el.addEventListener('blur', () => { if (el.value.trim()) el.value = group(num(el)); });
  }
}
