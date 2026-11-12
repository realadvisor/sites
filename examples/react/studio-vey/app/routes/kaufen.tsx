import type { Route } from './+types/kaufen';
import { SearchPage, searchLoader } from '../components/SearchPage';
import { brandName, site, sites } from '../lib/data.server';

export const loader = ({ request }: Route.LoaderArgs) =>
  searchLoader(request, 'buy', { site, brand: brandName, pool: () => sites.allListings({ offer_type: 'buy', status: 'available' }) });

export default function Page({ loaderData }: Route.ComponentProps) {
  return <SearchPage {...loaderData} />;
}
