/**
 * Progressive enhancement for <ValuationWidget /> (`[data-valuation-widget]`).
 *
 * - Reads Step 1 inputs (`propertyType` + `address`) natively in the agency
 *   site's own CSS tokens (zero iframe cost until the visitor starts).
 * - When `data-embed-url` points to an allowed RealAdvisor valuation host:
 *   expands a seamless chromeless iframe prefilled with Step 1 + active CSS
 *   tokens and listens for origin-checked `ra:valuation:resize` height events.
 * - When no `data-embed-url` is configured yet: gracefully prefills an on-page
 *   `#valuation` enquiry form (if present) or navigates to `data-fallback-href`.
 */
import {
  buildValuationEmbedUrl,
  buildValuationFallbackHref,
  parseValuationResizeMessage,
  type ValuationPropertyType,
  type ValuationThemeTokens,
} from '../lib/valuation';

function readSiteTokens(root: HTMLElement): ValuationThemeTokens {
  const cs = getComputedStyle(root);
  const rootCs = getComputedStyle(document.documentElement);
  const pick = (...vars: string[]) => {
    for (const v of vars) {
      const val = cs.getPropertyValue(v).trim() || rootCs.getPropertyValue(v).trim();
      if (val) return val;
    }
    return undefined;
  };
  return {
    bg: pick('--surface', '--bg', '--paper', '--control-bg'),
    fg: pick('--text', '--ink', '--control-text'),
    accent: pick('--accent', '--primary', '--control-focus'),
    radius: pick('--radius-btn', '--control-radius'),
    fontDisplay: pick('--font-display', '--font-serif'),
  };
}

function wireWidget(root: HTMLElement) {
  if (root.dataset.valuationWired === '1') return;
  root.dataset.valuationWired = '1';

  const form = root.querySelector<HTMLFormElement>('form[data-vw-form]');
  const addressInput = root.querySelector<HTMLInputElement>('input[name="address"]');
  const errorEl = root.querySelector<HTMLElement>('[data-vw-error]');
  const frameWrap = root.querySelector<HTMLElement>('[data-vw-frame-wrap]');
  if (!form || !addressInput) return;

  const embedUrl = root.dataset.embedUrl || '';
  const handoff = root.dataset.handoff || 'iframe';
  const fallbackHref = root.dataset.fallbackHref || '#valuation';
  const locale = root.dataset.locale || document.documentElement.lang || '';
  const frameTitle = root.dataset.frameTitle || 'Property valuation';
  const requiredMsg = root.dataset.msgRequired || 'Required';

  let activeIframe: HTMLIFrameElement | null = null;
  const onMessage = (event: MessageEvent) => {
    if (!activeIframe || event.source !== activeIframe.contentWindow) return;
    const height = parseValuationResizeMessage(event.origin, event.data);
    if (height != null) {
      activeIframe.style.height = `${height}px`;
    }
  };
  window.addEventListener('message', onMessage);

  addressInput.addEventListener('input', () => {
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
    addressInput.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const address = addressInput.value.trim();
    if (!address) {
      addressInput.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = requiredMsg;
        errorEl.hidden = false;
      }
      addressInput.focus();
      return;
    }

    const selected = form.querySelector<HTMLInputElement>('input[name="propertyType"]:checked');
    const propertyType: ValuationPropertyType =
      selected?.value === 'house' ? 'house' : 'apartment';

    const targetUrl = embedUrl
      ? buildValuationEmbedUrl({
          embedUrl,
          propertyType,
          address,
          locale,
          tokens: readSiteTokens(root),
        })
      : null;

    if (targetUrl && handoff === 'iframe' && frameWrap) {
      const iframe = document.createElement('iframe');
      iframe.src = targetUrl;
      iframe.title = frameTitle;
      iframe.className = 'vw-frame';
      iframe.loading = 'eager';
      iframe.setAttribute('allow', 'geolocation');
      frameWrap.replaceChildren(iframe);
      frameWrap.hidden = false;
      form.hidden = true;
      activeIframe = iframe;
      frameWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    if (targetUrl && handoff === 'redirect') {
      window.location.assign(targetUrl);
      return;
    }

    // Graceful fallback when no embed backend is wired yet: prefill an on-page
    // #valuation enquiry form if present, otherwise navigate to fallbackHref.
    const enquiryTarget =
      fallbackHref.startsWith('#')
        ? document.getElementById(fallbackHref.slice(1))
        : null;
    if (enquiryTarget) {
      const msgField = enquiryTarget.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
      if (msgField && !msgField.value.trim()) {
        const typeLabel =
          form.querySelector<HTMLElement>(`label[for="${selected?.id ?? ''}"]`)?.textContent?.trim() ||
          propertyType;
        msgField.value = `${typeLabel} — ${address}`;
      }
      enquiryTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      enquiryTarget.querySelector<HTMLElement>('input, textarea')?.focus();
      return;
    }

    window.location.assign(buildValuationFallbackHref(fallbackHref, propertyType, address));
  });
}

document.querySelectorAll<HTMLElement>('[data-valuation-widget]').forEach(wireWidget);
