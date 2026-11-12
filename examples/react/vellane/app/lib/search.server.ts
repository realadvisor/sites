/** Loader of /acheter and /louer: the offer type's available listings and the URL's filters. */
import { parseSearch } from '@realadvisor/sites-kit-react/lib/search';
import type { Offer, SearchData } from '../components/SearchPage';
import { siteData, sites } from './data.server';

export async function searchLoader(request: Request, offer: Offer): Promise<SearchData> {
  const params = parseSearch(new URL(request.url).searchParams);
  const [{ org }, pool] = await Promise.all([siteData(), sites.allListings({ offer_type: offer, status: 'available' })]);
  return { offer, orgName: org.name, pool, params };
}
