/**
 * Browser side of the enquiry form (components/EnquiryForm.astro and the React
 * kit's EnquiryForm.tsx render the same markup): validation, Turnstile, JSON
 * post to /api/enquiry, sent / preview / error states. Runs on import; event
 * delegation on document, so forms added later are covered too.
 */
// Event delegation on document: also covers forms injected later (dialogs, fragments).
type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
const formOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLFormElement>('[data-enquiry] form') : null);
const msg = (form: HTMLFormElement, k: string) => form.dataset[`msg${k[0]!.toUpperCase()}${k.slice(1)}`] ?? '';
const statusOf = (form: HTMLFormElement) => form.closest('[data-enquiry]')!.querySelector<HTMLElement>('[data-status]')!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- Turnstile (site key from rest-api, which also verifies the token) ----
type Turnstile = { render(el: HTMLElement, opts: Record<string, unknown>): string; reset(id?: string): void };
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const FIXTURE_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'; // fixture mode: nothing is sent, Turnstile never loads
const win = window as unknown as { turnstile?: Turnstile };
let turnstileApi: Promise<Turnstile> | undefined;
const loadTurnstile = () =>
  (turnstileApi ??= new Promise<Turnstile>((resolve, reject) => {
    if (win.turnstile) return resolve(win.turnstile);
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = () => (win.turnstile ? resolve(win.turnstile) : reject(new Error('turnstile')));
    s.onerror = () => {
      turnstileApi = undefined;
      s.remove();
      reject(new Error('turnstile'));
    };
    document.head.append(s);
  }));
const tokenField = (box: HTMLElement) => box.querySelector<HTMLInputElement>('input[name="turnstileToken"]');
const startWidget = (box: HTMLElement) => {
  if (box.dataset.started !== undefined) return;
  box.dataset.started = '';
  if (box.dataset.turnstile === 'fixture') {
    const input = Object.assign(document.createElement('input'), { type: 'hidden', name: 'turnstileToken', value: FIXTURE_TOKEN });
    box.append(input);
    return;
  }
  loadTurnstile().then(
    (ts) => {
      box.dataset.widget = ts.render(box, {
        sitekey: box.dataset.sitekey,
        action: 'enquiry',
        language: box.dataset.lang,
        appearance: 'interaction-only',
        'response-field-name': 'turnstileToken',
        'refresh-expired': 'auto',
      });
    },
    () => delete box.dataset.started, // retried on the next focus or submit
  );
};
const resetWidget = (box: HTMLElement | null) => {
  if (!box || box.dataset.turnstile === 'fixture' || !box.dataset.widget) return;
  const field = tokenField(box);
  if (field) field.value = '';
  win.turnstile?.reset(box.dataset.widget);
};
/** The widget's token; waits up to 10 s for a fresh one (first load, or after a reset). */
const tokenOf = async (box: HTMLElement) => {
  startWidget(box);
  for (let waited = 0; waited < 10_000; waited += 200) {
    const v = tokenField(box)?.value;
    if (v) return v;
    await sleep(200);
  }
  return '';
};
const near = 'IntersectionObserver' in window
  ? new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          near?.unobserve(e.target);
          startWidget(e.target as HTMLElement);
        }
      },
      { rootMargin: '400px' },
    )
  : null;

const show = (form: HTMLFormElement, kind: 'sent' | 'preview' | 'error', text = msg(form, kind)) => {
  const status = statusOf(form);
  status.textContent = text;
  status.dataset.kind = kind;
  status.hidden = false;
  if (kind !== 'error') form.hidden = true;
  status.focus();
};

const check = (form: HTMLFormElement, el: Field) => {
  const err = el.id ? form.querySelector<HTMLElement>(`#${CSS.escape(el.id)}-err`) : null;
  if (!err) return true;
  const v = el.value.trim();
  const problem =
    el.required && !v ? msg(form, el instanceof HTMLSelectElement ? 'unit' : 'required') : el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? msg(form, 'email') : '';
  el.setAttribute('aria-invalid', String(!!problem));
  err.textContent = problem;
  err.hidden = !problem;
  return !problem;
};

const init = () => {
  for (const root of document.querySelectorAll<HTMLElement>('[data-enquiry]:not([data-ready])')) {
    root.dataset.ready = '';
    const form = root.querySelector('form')!;
    form.querySelector<HTMLInputElement>('[data-redirect]')!.value = `${location.pathname}#${root.id}`;
    // A fresh id per page view (the HTML may come from a cache); kept for every retry of this form.
    const idem = form.querySelector<HTMLInputElement>('[data-idempotency]');
    if (idem && typeof crypto.randomUUID === 'function') idem.value = crypto.randomUUID();
    // No-JS round trip: /api/enquiry redirected back with ?enquiry=<state>.
    const back = new URLSearchParams(location.search).get('enquiry');
    if (location.hash === `#${root.id}` && (back === 'sent' || back === 'preview' || back === 'error')) show(form, back);
    const box = form.querySelector<HTMLElement>('[data-turnstile]');
    if (box) {
      if (box.dataset.turnstile === 'fixture' || !near) startWidget(box);
      else near.observe(box);
    }
  }
};
init();
new MutationObserver(init).observe(document.body, { childList: true, subtree: true });

document.addEventListener('focusin', (e) => {
  const box = formOf(e.target)?.querySelector<HTMLElement>('[data-turnstile]');
  if (box) startWidget(box);
});
document.addEventListener('focusout', (e) => {
  const form = formOf(e.target);
  if (form && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) check(form, e.target);
});
document.addEventListener('change', (e) => {
  const form = formOf(e.target);
  if (form && e.target instanceof HTMLSelectElement) check(form, e.target);
});

document.addEventListener('submit', async (e) => {
  const form = formOf(e.target);
  if (!form || form !== e.target) return;
  e.preventDefault();
  if (form.dataset.sending !== undefined) return; // double click / Enter while sending
  const fields = [...form.querySelectorAll<Field>('input[required], textarea[required], select[required]')];
  const bad = fields.filter((el) => !check(form, el));
  if (bad.length) return bad[0]!.focus();
  const box = form.querySelector<HTMLElement>('[data-turnstile]');
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const label = button.textContent ?? '';
  form.dataset.sending = '';
  button.disabled = true;
  button.textContent = msg(form, 'sending');
  try {
    if (box && !(await tokenOf(box))) return show(form, 'error', msg(form, 'verify'));
    const data = new FormData(form);
    data.set('pageUrl', location.href);
    const res = await fetch(form.action, { method: 'POST', body: data, headers: { accept: 'application/json' } });
    const body = (await res.json().catch(() => ({}))) as { preview?: boolean; error?: string; fields?: Record<string, string> };
    if (res.ok) return show(form, body.preview ? 'preview' : 'sent');
    resetWidget(box); // the token was spent (or refused): the next try needs a new one
    if (body.error === 'verification_required') return show(form, 'error', msg(form, 'verify'));
    if (body.error === 'rejected') return show(form, 'error', msg(form, 'rejected'));
    for (const [name, code] of Object.entries(body.fields ?? {})) {
      const el = form.querySelector<Field>(`[name="${name}"]`);
      const err = el?.id ? form.querySelector<HTMLElement>(`#${CSS.escape(el.id)}-err`) : null;
      if (el && err) {
        el.setAttribute('aria-invalid', 'true');
        err.textContent =
          code === 'invalid' && el.type === 'email' ? msg(form, 'email') : el instanceof HTMLSelectElement ? msg(form, 'unit') : msg(form, 'required');
        err.hidden = false;
      }
    }
    show(form, 'error');
  } catch {
    resetWidget(form.querySelector<HTMLElement>('[data-turnstile]'));
    show(form, 'error');
  } finally {
    delete form.dataset.sending;
    button.disabled = false;
    button.textContent = label;
  }
});

export {};
