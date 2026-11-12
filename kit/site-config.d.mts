export declare const SITE_CONFIG_FILE: 'site.json';
export type Country = 'CH' | 'FR' | 'ES' | 'IT';
export type SiteConfig = {
  country: Country;
  /** The default language, e.g. "fr-CH" (unprefixed URLs). */
  locale: string;
  /** Every locale of the site, the default first. */
  locales: string[];
  developmentsPath: string;
  /** 301s from the agency's old URLs: old path -> path on this site. */
  redirects: Record<string, string>;
};
export declare function normalizeSiteConfig(raw?: unknown): SiteConfig;
export declare function readSiteConfig(root: string): SiteConfig;
