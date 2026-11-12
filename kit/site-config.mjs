/**
 * The site's own settings: `site.json` at the site root. Everything else a
 * site needs from the kit comes from the package; this file is the one place
 * a site says who it is. Read by the kit integration (the
 * `virtual:sites-kit/site` module), the kit tools and crm-chat-api (the
 * site language). Plain JS: astro.config and node load it natively.
 *
 *   {
 *     "country": "CH",                 // CH | FR | ES | IT, from agency.address.country
 *     "locale": "fr-CH",               // the default language (unprefixed URLs)
 *     "locales": ["fr-CH", "en-CH"],   // multi-language sites: every locale, default first
 *     "developmentsPath": "/developments",
 *     "redirects": { "/proprietes/*": "/listings" }  // 301s from the agency's old URLs
 *   }
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SITE_CONFIG_FILE = 'site.json';

/** @typedef {'CH' | 'FR' | 'ES' | 'IT'} Country */
/**
 * @typedef {object} SiteConfig
 * @property {Country} country
 * @property {string} locale
 * @property {string[]} locales
 * @property {string} developmentsPath
 * @property {Record<string, string>} redirects
 */

const COUNTRIES = ['CH', 'FR', 'ES', 'IT'];
const LOCALE = /^[a-z]{2}-[A-Z]{2}$/;

/** The default country of a locale ('de-CH' -> 'CH', 'fr-FR' -> 'FR'). */
const countryOf = (locale) => {
  const c = locale.slice(3);
  return COUNTRIES.includes(c) ? c : 'CH';
};

/**
 * `raw` (the parsed site.json, or nothing) with every default filled in.
 * Throws on a value the kit cannot work with, naming the field.
 * @param {unknown} raw
 * @returns {SiteConfig}
 */
export function normalizeSiteConfig(raw = {}) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`${SITE_CONFIG_FILE} must be a JSON object`);
  }
  const r = /** @type {Record<string, unknown>} */ (raw);
  const locale = r.locale ?? 'fr-CH';
  if (typeof locale !== 'string' || !LOCALE.test(locale)) {
    throw new Error(`${SITE_CONFIG_FILE}: locale must look like "fr-CH" (got ${JSON.stringify(locale)})`);
  }
  const country = r.country ?? countryOf(locale);
  if (typeof country !== 'string' || !COUNTRIES.includes(country)) {
    throw new Error(`${SITE_CONFIG_FILE}: country must be one of ${COUNTRIES.join(', ')} (got ${JSON.stringify(country)})`);
  }
  const locales = r.locales ?? [locale];
  if (!Array.isArray(locales) || !locales.every((l) => typeof l === 'string' && LOCALE.test(l))) {
    throw new Error(`${SITE_CONFIG_FILE}: locales must be a list like ["fr-CH", "en-CH"]`);
  }
  // The default language is always first.
  const ordered = [locale, ...locales.filter((l) => l !== locale)];
  const developmentsPath = r.developmentsPath ?? '/developments';
  if (typeof developmentsPath !== 'string' || !/^\/[\p{L}\p{N}_/-]*$/u.test(developmentsPath)) {
    throw new Error(`${SITE_CONFIG_FILE}: developmentsPath must be a path like "/developments"`);
  }
  const redirects = r.redirects ?? {};
  if (redirects === null || typeof redirects !== 'object' || Array.isArray(redirects)) {
    throw new Error(`${SITE_CONFIG_FILE}: redirects must be an object of old path -> new path`);
  }
  for (const [from, to] of Object.entries(redirects)) {
    if (!from.startsWith('/') || typeof to !== 'string' || !to.startsWith('/') || to.startsWith('//')) {
      throw new Error(`${SITE_CONFIG_FILE}: redirect ${JSON.stringify(from)} -> ${JSON.stringify(to)} must map a path to a path on this site`);
    }
  }
  return {
    country: /** @type {Country} */ (country),
    locale,
    locales: ordered,
    developmentsPath: developmentsPath.length > 1 ? developmentsPath.replace(/\/+$/, '') : developmentsPath,
    redirects: /** @type {Record<string, string>} */ (redirects),
  };
}

/**
 * The site config of the site at `root` (defaults when it has no site.json).
 * @param {string} root
 * @returns {SiteConfig}
 */
export function readSiteConfig(root) {
  const file = join(root, SITE_CONFIG_FILE);
  if (!existsSync(file)) return normalizeSiteConfig({});
  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${SITE_CONFIG_FILE} is not valid JSON: ${/** @type {Error} */ (err).message}`);
  }
  return normalizeSiteConfig(raw);
}
