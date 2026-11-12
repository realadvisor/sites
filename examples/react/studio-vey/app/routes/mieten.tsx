import type { Route } from './+types/mieten';
import { SearchPage, searchLoader } from '../components/SearchPage';
import { brandName, site, sites } from '../lib/data.server';

export const loader = ({ request }: Route.LoaderArgs) =>
  searchLoader(request, 'rent', { site, brand: brandName, pool: () => sites.allListings({ offer_type: 'rent', status: 'available' }) });

export default function Page({ loaderData }: Route.ComponentProps) {
  return <SearchPage {...loaderData} />;
}
