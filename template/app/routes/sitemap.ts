/**
 * sitemap.xml: static pages, the legal pages of every language, every
 * available listing and the developments. Add each new page to STATIC_PATHS
 * (multi-language sites: each language's paths too).
 */
import { legalPaths, sitemap } from '@realadvisor/sites-kit-react/server/seo';
import { DEVELOPMENTS_PATH, developmentUrl } from '@realadvisor/sites-kit-core/developments';
import { listingUrl } from '@realadvisor/sites-kit-core/format';
import { sites } from '../lib/data.server';

const STATIC_PATHS = ['/', '/listings'];

export async function loader() {
  const [listings, developments] = await Promise.all([sites.allListings({ status: 'available' }), sites.developments()]);
  return sitemap([
    ...STATIC_PATHS,
    ...legalPaths(),
    ...listings.map(listingUrl),
    ...(developments.length ? [DEVELOPMENTS_PATH, ...developments.map(developmentUrl)] : []),
  ]);
}
