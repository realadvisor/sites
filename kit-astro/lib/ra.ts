/**
 * The only way this site reads data. Every page imports `ra` from here: the
 * `@realadvisor/sites-sdk` SitesClient (records as the API sends them, in
 * snake_case), plus `agency()`.
 *
 * - Production and published previews: SITES_API_URL (var, the rest-api
 *   origin) + SITES_API_KEY (Worker secret, the site's api_site key), both set
 *   at publish. The Worker calls rest-api /v3/public directly; rest-api caches
 *   reads for 60 s. The listings are those of the site's own portal.
 * - Sandbox preview: the same two, set by the runtime in .dev.vars. The key is
 *   a placeholder the sandbox firewall fills in. Real data; enquiries are
 *   answered by the firewall, never sent.
 * - Local key mode: SITES_API_URL + SITES_API_KEY in .dev.vars / env.
 * - Fixture mode: everything else (pnpm dev, evals, build-time prerender).
 *   Reads src/data/<SITES_FIXTURE>.json (default: the first one), plus the
 *   developments of every development-<slug>.json there. No network, and
 *   enquiries are never sent.
 *
 * On a site with more than one locale, listings and developments come in the
 * page's language (`locale`, from the URL: lib/page-locale.ts) when the CRM
 * has their texts in it; `text_locale` then says so.
 *
 * Pages that show listings, agents or agency data render on request
 * (`export const prerender = false`) so production gets live data.
 *
 * Never import this file from client-side code (<script> tags, framework
 * islands): it runs on the server only.
 */
import { createClient, createFixtureClient } from '@realadvisor/sites-sdk';
import type { DevelopmentWithUnits, SitesClient } from '@realadvisor/sites-sdk/types';
import { SITES_API_KEY, SITES_API_URL, SITES_FIXTURE } from 'astro:env/server';
import fixtures from 'virtual:sites-kit/fixtures';
import { previewApi } from '@realadvisor/sites-kit-core/env';
import { agencyOf, type Agency, type SiteFixture } from '@realadvisor/sites-kit-core/agency';
import { withTextLocale } from '@realadvisor/sites-kit-core/page-locale';

export type { Address, Agent, Development, DevelopmentWithUnits, Listing, Organisation, Photo, Team, Unit } from '@realadvisor/sites-sdk/types';
export type { Agency, SiteFixture };

export type SiteClient = SitesClient & {
  /** The organisation and its office (primary team) as one record: header, legal text, JSON-LD. */
  agency(): Promise<Agency>;
  /** The live SDK client, or null in fixture mode (the enquiry endpoint sends through it). */
  live(): SitesClient | null;
};

const isFixture = (d: unknown): d is SiteFixture =>
  !!d && typeof d === 'object' && 'organisation' in d && Array.isArray((d as SiteFixture).listings);

function pickFixture(): SiteFixture {
  // Only files shaped like a fixture count, so other JSON in src/data/ is ignored.
  const entries = Object.entries(fixtures).filter((e): e is [string, { default: SiteFixture }] => isFixture(e[1].default));
  const isDev = ([path]: [string, unknown]) => /\/development-[^/]+\.json$/.test(path);
  const wanted = SITES_FIXTURE
    ? entries.find(([path]) => path.endsWith(`/${SITES_FIXTURE}.json`))
    : (entries.find((e) => !isDev(e)) ?? entries[0]);
  if (!wanted) {
    throw new Error(
      SITES_FIXTURE
        ? `Fixture src/data/${SITES_FIXTURE}.json not found`
        : 'No SITES_API_KEY and no fixture in src/data/. Run `pnpm fixture <name>` or set SITES_API_KEY.',
    );
  }
  const site = wanted[1].default;
  const developments: DevelopmentWithUnits[] = [...(site.developments ?? [])];
  for (const e of entries) {
    if (e === wanted || !isDev(e)) continue;
    for (const d of e[1].default.developments ?? []) if (!developments.some((x) => x.id === d.id)) developments.push(d);
  }
  return { ...site, developments };
}

const access = () => {
  // .dev.vars reach astro:env or locals.runtime.env depending on the server: read both.
  const p = previewApi();
  const url = SITES_API_URL || p.url;
  const key = p.token || SITES_API_KEY;
  return url && key ? { url, key } : null;
};

let live: { id: string; client: SitesClient } | undefined;
let fixture: { data: SiteFixture; client: SitesClient } | undefined;

function liveClient(): SitesClient | null {
  const a = access();
  if (!a) return null;
  const id = `${a.url}\0${a.key}`;
  if (live?.id !== id) live = { id, client: createClient({ url: a.url, key: a.key }) };
  return live.client;
}

function fixtureClient() {
  if (!fixture) {
    const data = pickFixture();
    fixture = { data, client: createFixtureClient(data) };
  }
  return fixture;
}

const client = () => liveClient() ?? fixtureClient().client;

/** True when data comes from src/data (no SITES_API_URL + SITES_API_KEY). */
export const isFixtureMode = () => !access();

/** The SDK's SitesClient on live data or the fixture, plus `agency()`. */
export const ra: SiteClient = {
  organisation: () => client().organisation(),
  teams: () => client().teams(),
  agents: (q) => client().agents(q),
  listings: (q) => client().listings(withTextLocale(q)),
  allListings: (q) => client().allListings(withTextLocale(q)),
  listing: (slugOrId, q) => client().listing(slugOrId, withTextLocale(q)),
  developments: (q) => client().developments(withTextLocale(q)),
  development: (slugOrId, q) => client().development(slugOrId, withTextLocale(q)),
  turnstileSiteKey: () => client().turnstileSiteKey(),
  live: liveClient,
  agency: async () => {
    const c = client();
    const [org, teams] = await Promise.all([c.organisation(), c.teams()]);
    const a = agencyOf(org, teams.find((t) => t.primary) ?? teams[0], liveClient() ? undefined : fixtureClient().data.legal);
    // A team without a phone or email takes the first agent's.
    if (!a.phone || !a.email) {
      const people = await c.agents();
      const phone = a.phone ?? people.find((p) => p.phone)?.phone;
      const email = a.email ?? people.find((p) => p.email)?.email;
      if (phone) a.phone = phone;
      if (email) a.email = email;
    }
    return a;
  },
};

/**
 * Every listing matching `q`, every page read (`ra.allListings`). Use it when
 * you filter or sort in the page (search, agent pages, sitemap); use
 * `ra.listings({ limit, offset })` for paginated lists.
 */
export const allListings = (q?: Parameters<SitesClient['allListings']>[0]) => ra.allListings(q);

/**
 * Public Turnstile site key for <EnquiryForm> (from rest-api, kept 5 min).
 * `null`: no widget. Fixture mode: the SDK's stand-in key, so the form
 * renders a widget that never loads Turnstile.
 */
export const turnstileSiteKey = (): Promise<string | null> => ra.turnstileSiteKey().catch(() => null);
