/** Payment estimate: recompute the monthly amount on input. */
const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
document.querySelectorAll<HTMLElement>('[data-pay]').forEach((box) => {
  const price = Number(box.dataset.price);
  const out = box.querySelector<HTMLOutputElement>('[data-pay-out]');
  const loanEl = box.querySelector<HTMLElement>('[data-pay-loan]');
  const ins = [...box.querySelectorAll<HTMLInputElement>('[data-pay-in]')];
  const get = (name: string, lo: number, hi: number) => {
    const v = Number(ins.find((i) => i.name === name)?.value.replace(',', '.'));
    return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : NaN;
  };
  const run = () => {
    const down = get('down', 0, 90), rate = get('rate', 0, 15), years = get('years', 1, 40);
    if (!out || [down, rate, years].some(Number.isNaN)) return;
    const loan = price * (1 - down / 100);
    const n = years * 12, r = rate / 100 / 12;
    const m = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
    out.textContent = eur.format(Math.round(m));
    if (loanEl) loanEl.textContent = eur.format(Math.round(loan));
  };
  ins.forEach((i) => i.addEventListener('input', run));
});
export {};
