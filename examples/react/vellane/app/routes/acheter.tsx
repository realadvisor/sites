import type { Route } from './+types/acheter';
import { SearchPage } from '../components/SearchPage';
import { searchLoader } from '../lib/search.server';

export const loader = ({ request }: Route.LoaderArgs) => searchLoader(request, 'buy');

export default function Page({ loaderData }: Route.ComponentProps) {
  return <SearchPage {...loaderData} />;
}
