/**
 * Request-side kit settings for the root loader:
 *
 *   export async function loader({ request }: Route.LoaderArgs) {
 *     return { kit: await kitData(), ... };
 *   }
 *
 * and `canonical(request)` for every page's <Seo>.
 */
import { analyticsId, siteMode } from '@realadvisor/sites-kit-core/env';
import { canonicalUrl } from '@realadvisor/sites-kit-core/seo';
import { localeOfPath } from '@realadvisor/sites-kit-core/i18n';
import { FIXTURE_TURNSTILE_SITE_KEY } from '@realadvisor/sites-sdk';
import { liveClient } from './data';
import type { KitData } from '../components/Document';

/** Public origin: SITE_URL (set at publish), else the placeholder the Astro kit uses. */
export function siteUrl(): string {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.SITE_URL || import.meta.env.SITE_URL || 'https://example.realadvisor.site';
}

/** Canonical URL of a request on the public origin (every active filter kept, utm & co dropped). */
export const canonical = (request: Request | URL | string) =>
  canonicalUrl(new URL(typeof request === 'string' ? request : request instanceof URL ? request.href : request.url), siteUrl());

/** The locale of a request's path (site.json `locales`): what `usePageLocale()` gives the page. */
export const pageLocale = (request: Request | URL | string) =>
  localeOfPath(new URL(typeof request === 'string' ? request : request instanceof URL ? request.href : request.url, 'http://x').pathname);

/**
 * Public Turnstile site key (the SDK's `turnstileSiteKey()`, kept 5 min).
 * Fixture mode: the stand-in key (the form renders a widget that never loads
 * Turnstile). `null`: no widget.
 */
export function turnstileSiteKey(): Promise<string | null> {
  // The verification route needs no portal: the site's own client.
  const live = liveClient();
  return live ? live.turnstileSiteKey().catch(() => null) : Promise.resolve(FIXTURE_TURNSTILE_SITE_KEY);
}

/** The kit settings of this request (root loader: `{ kit: await kitData() }`). */
export async function kitData(): Promise<KitData> {
  const mode = siteMode();
  return {
    mode,
    analyticsId: analyticsId(),
    // Preview sites never send: no widget there.
    turnstileSiteKey: mode === 'preview' ? null : await turnstileSiteKey(),
    siteUrl: siteUrl(),
  };
}
