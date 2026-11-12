/**
 * Upgrades every [data-combobox] native select (components/form/Combobox.astro,
 * the React kit's Combobox.tsx) to an ARIA 1.2 combobox. Runs on import; a
 * root is set up once (data-ready).
 */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let uid = 0;
for (const root of document.querySelectorAll<HTMLElement>('[data-combobox]')) {
  if (root.dataset.ready) continue;
  root.dataset.ready = '1';
  const select = root.querySelector('select')!;
  const wrap = select.parentElement!;
  const opts = [...select.options].map((o) => ({ value: o.value, label: o.text }));
  const listId = `cb-list-${++uid}`;
  const input = document.createElement('input');
  input.className = 'control';
  input.id = select.id;
  select.removeAttribute('id');
  input.type = 'text';
  input.autocomplete = 'off';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', listId);
  input.placeholder = opts[0]?.value === '' ? opts[0].label : '';
  const current = () => opts.find((o) => o.value === select.value);
  input.value = select.value ? current()?.label ?? '' : '';
  const list = document.createElement('ul');
  list.id = listId;
  list.className = 'combobox-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  wrap.classList.remove('select');
  wrap.hidden = true; // keep the select in the form (it carries the value), hide it
  root.append(input, list);

  let shown: typeof opts = [];
  let active = -1;
  const render = () => {
    const q = norm(input.value.trim());
    const sel = current();
    shown = q && sel?.label !== input.value ? opts.filter((o) => norm(o.label).includes(q)) : opts;
    list.innerHTML = '';
    shown.forEach((o, i) => {
      const li = document.createElement('li');
      li.id = `${listId}-${i}`;
      li.className = 'combobox-option' + (i === active ? ' is-active' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(o.value === select.value));
      li.textContent = o.label;
      li.addEventListener('mousedown', (e) => { e.preventDefault(); choose(o); });
      list.append(li);
    });
    if (!shown.length) {
      const li = document.createElement('li');
      li.className = 'combobox-empty';
      li.textContent = root.dataset.noResults ?? '–';
      list.append(li);
    }
    input.setAttribute('aria-activedescendant', active >= 0 ? `${listId}-${active}` : '');
  };
  const open = () => { list.hidden = false; input.setAttribute('aria-expanded', 'true'); render(); };
  const close = () => {
    list.hidden = true; active = -1; input.setAttribute('aria-expanded', 'false');
    input.value = select.value ? current()?.label ?? '' : '';
  };
  const choose = (o: { value: string; label: string }) => {
    select.value = o.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    close();
  };
  const move = (d: number) => {
    if (list.hidden) open();
    if (!shown.length) return;
    active = (active + d + shown.length) % shown.length;
    render();
    list.children[active]?.scrollIntoView({ block: 'nearest' });
  };
  input.addEventListener('focus', open);
  input.addEventListener('input', () => { active = shown.length ? 0 : -1; open(); active = shown.length ? 0 : -1; render(); });
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && !list.hidden && active >= 0) { e.preventDefault(); choose(shown[active]!); }
    else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); close(); }
  });
}

export {};
