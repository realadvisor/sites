// Enquiry form in the browser (preview: never sent), both languages, and without JavaScript (303 back with ?enquiry=).
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:4517';
const ok = (c, m) => console.log(`${c ? 'ok  ' : 'FAIL'} ${m}`);
const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
for (const [path, word] of [['/contatti', 'Anteprima'], ['/en/contact', 'Preview']]) {
  await p.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await p.click('#enquiry button[type=submit]');
  ok(await p.isVisible('#enquiry-name-err'), `${path}: empty submit shows field errors`);
  await p.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await p.fill('#enquiry-name', 'Test');
  await p.fill('#enquiry-email', 'test@example.com');
  await p.fill('#enquiry-message', 'Ciao');
  await p.click('#enquiry button[type=submit]');
  await p.waitForFunction(() => !document.querySelector('#enquiry [data-status]').hidden, null, { timeout: 10000 });
  const status = (await p.textContent('#enquiry [data-status]')) ?? '';
  ok(status.includes(word), `${path}: preview status shown (${status.slice(0, 50)})`);
}
// The valuation form on /vendere (its own id) and a listing form.
await p.goto(`${base}/vendere`, { waitUntil: 'networkidle' });
ok(await p.isVisible('#valuation-form-name'), 'valuation form present on /vendere');
const form = new URLSearchParams({ name: 'A', email: 'a@example.com', message: 'm', redirect: '/contatti#enquiry' });
const res = await fetch(`${base}/api/enquiry`, { method: 'POST', body: form, redirect: 'manual', headers: { origin: base } });
const cross = await fetch(`${base}/api/enquiry`, { method: 'POST', body: form, redirect: 'manual', headers: { origin: 'https://evil.example' } });
ok(cross.status === 403, `cross-site form post refused (${cross.status})`);
ok(res.status === 303 && res.headers.get('location') === '/contatti?enquiry=preview#enquiry', `no-JS post: ${res.status} ${res.headers.get('location')}`);
ok(!errs.length, `no console errors${errs.length ? `: ${errs.join(' | ')}` : ''}`);
await b.close();
