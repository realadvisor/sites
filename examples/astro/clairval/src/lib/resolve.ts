/**
 * Page-level lookups for the routes with a slug: a page answers the 404
 * page before it renders its view.
 */
import { sites } from './data';
import { agentSlug, teamSlug } from './routes';

export const findAgent = async (slug: string) => {
  const agents = await sites.agents();
  return agents.find((a) => agentSlug(a, agents) === slug) ?? null;
};
export const findTeam = async (slug: string) => {
  const teams = await sites.teams();
  return teams.find((x) => teamSlug(x, teams) === slug) ?? null;
};
