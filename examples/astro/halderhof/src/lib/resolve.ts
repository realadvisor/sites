/**
 * Page-level lookups for the routes with a slug: a page answers the 404
 * page before it renders its view.
 */
import { sites } from './data';
import { agentSlug, teamSlug, unitIdPrefix } from './routes';
import { regionList } from './regions';

export const findAgent = async (slug: string) => {
  const agents = await sites.agents();
  return agents.find((a) => agentSlug(a, agents) === slug) ?? null;
};
export const findTeam = async (slug: string) => {
  const teams = await sites.teams();
  return teams.find((x) => teamSlug(x, teams) === slug) ?? null;
};
export const findRegion = async (slug: string) => (await regionList()).find((r) => r.slug === slug) ?? null;
export const findUnit = async (devSlug: string, unitSlug: string) => {
  const dev = await sites.development(devSlug);
  const prefix = unitIdPrefix(unitSlug);
  const unit = dev && prefix ? dev.units.find((u) => u.id.toLowerCase().startsWith(prefix)) : undefined;
  return dev && unit ? { dev, unit } : null;
};
