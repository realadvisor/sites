// Phone menu (native popover): close it when a link inside is followed, and
// keep the burger's aria-expanded in step with the sheet.
const sheet = document.querySelector<HTMLElement>('[data-menu]');
const burger = document.querySelector<HTMLButtonElement>('.hd__burger');
if (sheet) {
  sheet.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) sheet.hidePopover?.();
  });
  sheet.addEventListener('toggle', (e) => {
    const open = (e as ToggleEvent).newState === 'open';
    burger?.setAttribute('aria-expanded', String(open));
    if (!open) burger?.focus();
  });
  burger?.setAttribute('aria-expanded', 'false');
}
