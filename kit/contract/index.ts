// The contract between the kit and crm-chat-api, in one place: the codes of
// the kit checks' findings the CRM translates, and the site settings
// (site.json) both sides read. The SDK types are the package root's.
export * from './check-codes.js';
export {
  SITE_CONFIG_FILE,
  normalizeSiteConfig,
  type Country,
  type SiteConfig,
} from '../site-config.mjs';
