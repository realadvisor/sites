/**
 * Pure helpers for the agency website ValuationWidget (Step 1 -> funnel handoff).
 * Backend-agnostic: builds prefilled embed or redirect URLs, validates allowed
 * RealAdvisor valuation origins, and extracts the active site's CSS tokens so
 * the embedded funnel matches the agency website's design system.
 */

export const VALUATION_PROPERTY_TYPES = ['apartment', 'house'] as const;
export type ValuationPropertyType = (typeof VALUATION_PROPERTY_TYPES)[number];

/** Hosts that may be framed by <ValuationWidget /> (kept in sync with sites/deploy/csp.json). */
export const VALUATION_EMBED_HOSTS = [
  'https://realadvisor.ch',
  'https://realadvisor.fr',
  'https://realadvisor.es',
  'https://realadvisor.it',
  'https://realadvisor.pl',
  'https://realadvisor.pt',
  'https://realadvisor.com',
] as const;

const ALLOWED_EMBED_HOST_RE =
  /^(?:(?:[a-z0-9-]+\.)*realadvisor\.(?:ch|fr|es|it|pl|pt|com))$/i;

export type ValuationThemeTokens = {
  bg?: string;
  fg?: string;
  accent?: string;
  radius?: string;
  fontDisplay?: string;
};

export type ValuationEmbedParams = {
  embedUrl: string;
  propertyType: ValuationPropertyType;
  address: string;
  locale?: string;
  tokens?: ValuationThemeTokens;
};

/** Returns true only for HTTPS RealAdvisor valuation origins (no open iframe redirects). */
export function isAllowedValuationEmbedUrl(raw: string | null | undefined): boolean {
  if (typeof raw !== 'string' || !raw.trim()) return false;
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' && ALLOWED_EMBED_HOST_RE.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Builds the prefilled valuation URL from Step 1 inputs (`propertyType`,
 * `address`) plus optional site CSS tokens (`--ra-bg`, `--ra-fg`, `--ra-accent`,
 * `--ra-radius`, `--ra-font-display`). Rejects non-RealAdvisor origins.
 */
export function buildValuationEmbedUrl({
  embedUrl,
  propertyType,
  address,
  locale,
  tokens,
}: ValuationEmbedParams): string | null {
  if (!isAllowedValuationEmbedUrl(embedUrl)) return null;
  const u = new URL(embedUrl.trim());
  u.searchParams.set('embed', '1');
  u.searchParams.set(
    'propertyType',
    VALUATION_PROPERTY_TYPES.includes(propertyType) ? propertyType : 'apartment',
  );
  const cleanAddress = address.trim().slice(0, 200);
  if (cleanAddress) u.searchParams.set('address', cleanAddress);
  if (locale?.trim()) u.searchParams.set('locale', locale.trim());
  if (tokens?.bg?.trim()) u.searchParams.set('bg', tokens.bg.trim().slice(0, 40));
  if (tokens?.fg?.trim()) u.searchParams.set('fg', tokens.fg.trim().slice(0, 40));
  if (tokens?.accent?.trim()) u.searchParams.set('accent', tokens.accent.trim().slice(0, 40));
  if (tokens?.radius?.trim()) u.searchParams.set('radius', tokens.radius.trim().slice(0, 20));
  if (tokens?.fontDisplay?.trim()) {
    u.searchParams.set('fontDisplay', tokens.fontDisplay.trim().slice(0, 80));
  }
  return u.toString();
}

/** Builds a safe relative fallback URL (e.g. `/valuation?type=house&address=...`) for callback forms. */
export function buildValuationFallbackHref(
  fallbackHref: string,
  propertyType: ValuationPropertyType,
  address: string,
): string {
  const cleanBase = fallbackHref.trim();
  const safeBase =
    cleanBase.startsWith('/') && !cleanBase.startsWith('//') ? cleanBase : '/valuation';
  const [pathAndQuery, hash = ''] = safeBase.split('#');
  const [pathname, existingQuery = ''] = pathAndQuery.split('?');
  const params = new URLSearchParams(existingQuery);
  params.set(
    'type',
    VALUATION_PROPERTY_TYPES.includes(propertyType) ? propertyType : 'apartment',
  );
  const cleanAddress = address.trim().slice(0, 200);
  if (cleanAddress) params.set('address', cleanAddress);
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ''}${hash ? `#${hash}` : ''}`;
}

/** Parses a verified postMessage height update from an embedded RealAdvisor valuation iframe. */
export function parseValuationResizeMessage(
  origin: string,
  data: unknown,
): number | null {
  if (!isAllowedValuationEmbedUrl(origin)) return null;
  if (!data || typeof data !== 'object') return null;
  const msg = data as { type?: unknown; height?: unknown };
  if (msg.type !== 'ra:valuation:resize') return null;
  const h = Number(msg.height);
  if (!Number.isFinite(h) || h < 240 || h > 4000) return null;
  return Math.round(h);
}
