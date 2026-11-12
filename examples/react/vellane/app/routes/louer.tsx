import type { Route } from './+types/louer';
import { SearchPage } from '../components/SearchPage';
import { searchLoader } from '../lib/search.server';

export const loader = ({ request }: Route.LoaderArgs) => searchLoader(request, 'rent');

export default function Page({ loaderData }: Route.ComponentProps) {
  return <SearchPage {...loaderData} />;
}
