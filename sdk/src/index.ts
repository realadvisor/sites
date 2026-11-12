/**
 * @realadvisor/sites-sdk: how a RealAdvisor site reads its data. One URL and
 * one key (SITES_API_URL, SITES_API_KEY in process.env) in every framework
 * and environment; rest-api owns every data rule, the SDK adds transport,
 * types, `err.code` and the enquiry endpoint. Web standards only.
 */
import type {
  Agent,
  Fixture,
  FixtureTranslations,
  ClientOptions,
  Development,
  DevelopmentWithUnits,
  ErrorCode,
  Listing,
  ListingsQuery,
  Organisation,
  Page,
  SitesClient,
  Team,
  TextQuery,
  Unit,
} from './types.ts';

export type * from './types.ts';

const TIMEOUT_MS = 8000;
const PAGE = 200;
/** How long turnstileSiteKey() keeps a key (30 s when there is none). */
const TURNSTILE_TTL_MS = 5 * 60 * 1000;
/** The last offset rest-api accepts (its MAX_OFFSET). */
const MAX_OFFSET = 10_000;
const NO_ACCESS = 'no data access: set SITES_API_URL and SITES_API_KEY';
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Status `handleEnquiry` answers for each code. */
const STATUS: Record<ErrorCode, number> = {
  invalid: 400,
  invalid_portal: 400,
  invalid_team: 400,
  rejected: 400,
  site_key: 401,
  verification_required: 403,
  rate_limited: 429,
  unavailable: 502,
};

export class SitesApiError extends Error {
  readonly code: ErrorCode;
  /** The HTTP status the API answered, 0 when none (timeout, network, no data access). */
  readonly status: number;
  /** `invalid`: the wrong fields, e.g. `{ email: 'invalid' }`. */
  readonly fields?: Record<string, string>;

  constructor(code: ErrorCode, message: string, opts: { status?: number; fields?: Record<string, string> } = {}) {
    super(message);
    this.name = 'SitesApiError';
    this.code = code;
    this.status = opts.status ?? 0;
    if (opts.fields) this.fields = opts.fields;
  }
}

/** The one code of an API failure, from its status and the body's `error`. */
const codeOf = (status: number, error: unknown): ErrorCode => {
  if (status === 400) {
    return error === 'invalid_portal' || error === 'invalid_team' || error === 'rejected' ? error : 'invalid';
  }
  if (status === 401) return 'site_key';
  if (status === 403) {
    // Any other 403 (a key that may not read this) is the key's.
    return error === 'verification_required' ? 'verification_required' : 'site_key';
  }
  if (status === 429) return 'rate_limited';
  return 'unavailable';
};

const env = (name: string): string | undefined => {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[name]?.trim() || undefined;
};

/** Sends the enquiry `handleEnquiry` built: kept off the client's public methods. */
const SEND = Symbol('sites-sdk.send');

type Send = (body: Record<string, unknown>, clientIp?: string) => Promise<{ id: string }>;

const query = (q: Record<string, unknown>) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v != null && v !== '') params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : '';
};

export const createClient = (opts: ClientOptions = {}): SitesClient => {
  const portals = opts.portals;
  // Read per call: a Worker's process.env is set by then, and a build
  // without data access only fails where it reads data.
  const access = () => {
    const url = opts.url ?? env('SITES_API_URL');
    const key = opts.key ?? env('SITES_API_KEY');
    if (!url || !key) throw new SitesApiError('unavailable', NO_ACCESS);
    return { root: url.replace(/\/+$/, ''), key };
  };

  const once = async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const { root, key } = access();
    const doFetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await doFetch(`${root}${path}`, {
        method,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${key}`,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: abort.signal,
      });
    } catch (err) {
      const timedOut = abort.signal.aborted;
      throw new SitesApiError('unavailable', `${method} ${path}: ${timedOut ? `no answer in ${TIMEOUT_MS / 1000} s` : (err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
    return res;
  };

  /** One API call: JSON, or null on 404 when `orNull`. A GET that finds the API unavailable is tried once more. */
  const call = async <T>(method: 'GET' | 'POST', path: string, init: { body?: unknown; headers?: Record<string, string>; orNull?: boolean } = {}): Promise<T> => {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await once(method, path, init.body, init.headers);
        if (res.ok) return (await res.json()) as T;
        if (res.status === 404 && init.orNull) return null as T;
        const err = (await res.json().catch(() => ({}))) as { error?: unknown; fields?: Record<string, string>; detail?: string; title?: string };
        const code = codeOf(res.status, err.error);
        throw new SitesApiError(code, `${method} ${path}: ${res.status} ${err.detail ?? err.title ?? (typeof err.error === 'string' ? err.error : code)}`, {
          status: res.status,
          fields: err.fields,
        });
      } catch (err) {
        const retry = method === 'GET' && attempt === 0 && err instanceof SitesApiError && err.code === 'unavailable' && err.message !== NO_ACCESS;
        if (!retry) throw err;
      }
    }
  };

  /** A portal by name; without `portals`, none: rest-api uses the site's own. */
  const portalId = (name?: string) => {
    if (!portals && name === undefined) return undefined;
    const id = portals?.[name ?? 'main'];
    if (!id) throw new SitesApiError('invalid_portal', `portal "${name}" is not in the client's portals`, { status: 400 });
    return id;
  };

  /** Every portal of the client: a listing or unit live on any of them shows. */
  const allPortals = () => (portals ? [...new Set(Object.values(portals))].join(',') : undefined);

  let turnstile: { at: number; key: Promise<string | null> } | undefined;
  const turnstileSiteKey = () => {
    if (!turnstile || Date.now() - turnstile.at > TURNSTILE_TTL_MS) {
      const key = call<{ site_key?: unknown }>('GET', '/v3/public/enquiries/verification').then(
        res => (typeof res?.site_key === 'string' && res.site_key ? res.site_key : null),
        (err: unknown) => {
          // A 403 (a key that may not read this): no widget; rest-api still decides on the enquiry.
          if (!(err instanceof SitesApiError && err.code === 'site_key' && err.status === 403)) {
            console.error(`[sites-sdk] turnstile site key lookup failed: ${(err as Error).message}`);
          }
          return null;
        },
      );
      const entry = { at: Date.now(), key };
      // No key: ask again after 30 s, not 5 min.
      void key.then(k => {
        if (!k) entry.at = Date.now() - TURNSTILE_TTL_MS + 30_000;
      });
      turnstile = entry;
    }
    return turnstile.key;
  };

  const listings = async ({ portal, limit, ...q }: ListingsQuery = {}) => {
    const n = Math.min(Math.max(Math.trunc(limit ?? 24), 1), PAGE);
    return call<Page<Listing>>('GET', `/v3/public/listings${query({ ...q, portal_ids: portalId(portal), limit: n })}`);
  };

  /**
   * Every row of a list: the first page gives the total, the others are read
   * at once. It ends with the last page rest-api serves (offset MAX_OFFSET).
   */
  const all = async <T>(page: (limit: number, offset: number) => Promise<Page<T>>) => {
    const first = await page(PAGE, 0);
    const offsets: number[] = [];
    for (let offset = PAGE; offset < first.pagination.total && offset <= MAX_OFFSET; offset += PAGE) offsets.push(offset);
    const rest = await Promise.all(offsets.map(offset => page(PAGE, offset)));
    return [first, ...rest].flatMap(p => p.data);
  };
  const list = <T>(path: string, q: Record<string, unknown> = {}) =>
    all((limit, offset) => call<Page<T>>('GET', `${path}${query({ ...q, limit, offset })}`));

  const client: SitesClient & { [SEND]: Send } = {
    organisation: () => call<Organisation>('GET', '/v3/public/organisation'),
    teams: () => list<Team>('/v3/public/teams'),
    agents: (q = {}) => list<Agent>('/v3/public/agents', q),
    listings,
    allListings: (q = {}) => all((limit, offset) => listings({ ...q, limit, offset })),
    listing: async (slugOrId, q = {}) => {
      const id = slugOrId.match(UUID_RE)?.[0].toLowerCase();
      if (!id) return null;
      return call<Listing | null>('GET', `/v3/public/listings/${id}${query({ portal_ids: allPortals(), locale: q.locale })}`, { orNull: true });
    },
    developments: (q = {}) => list<Development>('/v3/public/developments', { ...q, portal_ids: allPortals() }),
    development: (slugOrId, q = {}) =>
      call<DevelopmentWithUnits | null>(
        'GET',
        `/v3/public/developments/${encodeURIComponent(slugOrId)}${query({ portal_ids: allPortals(), locale: q.locale })}`,
        { orNull: true },
      ),
    turnstileSiteKey,
    [SEND]: (body, clientIp) =>
      call<{ id: string }>('POST', '/v3/public/enquiries', {
        body: { ...body, portal_id: portalId() },
        headers: clientIp ? { 'x-ra-client-ip': clientIp } : {},
      }),
  };
  return client;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS: Record<string, number> = { name: 100, email: 200, phone: 40, message: 5000 };
const REASONS = new Set(['buy', 'sell', 'valuation', 'other']);
const PASSED = ['phone', 'listing_id', 'agent_id', 'development_id', 'lot_id', 'team_id', 'contact_reason', 'locale', 'page_url', 'idempotency_key'];

const readBody = async (request: Request): Promise<Record<string, string>> => {
  const out: Record<string, string> = {};
  if ((request.headers.get('content-type') ?? '').includes('application/json')) {
    const json = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    for (const [k, v] of Object.entries(json ?? {})) if (typeof v === 'string') out[k] = v;
  } else {
    const form = await request.formData().catch(() => null);
    for (const [k, v] of form ?? []) if (typeof v === 'string') out[k] = v;
  }
  return out;
};

/**
 * The site's whole enquiry endpoint: a standard Request in, a Response out.
 * JSON in, JSON out: `{ id }`, `{ preview: true }` (SITE_MODE=preview: never
 * sent) or `{ code, fields? }` with the code's status. Fields are named as
 * rest-api names them (`listing_id`, `contact_reason`, ...). A form posted without
 * JavaScript gets a 303 back to its `redirect` with `?enquiry=sent|preview|error`.
 * Codes only: the site's form words them in its language.
 */
export const handleEnquiry = async (request: Request, ra: SitesClient): Promise<Response> => {
  const body = await readBody(request);
  const field = (k: string) => body[k]?.trim() || undefined;
  const wantsJson =
    (request.headers.get('accept') ?? '').includes('application/json') ||
    (request.headers.get('content-type') ?? '').includes('application/json');
  const respond = (status: number, json: Record<string, unknown>, state: 'sent' | 'preview' | 'error') => {
    if (wantsJson) return Response.json(json, { status });
    const back = field('redirect') ?? '/';
    // Only a same-site path; the state goes before the #anchor.
    const target = new URL(back.startsWith('/') && !back.startsWith('//') ? back : '/', 'http://site');
    target.searchParams.set('enquiry', state);
    return new Response(null, { status: 303, headers: { location: target.pathname + target.search + target.hash } });
  };

  const fields: Record<string, string> = {};
  for (const k of ['name', 'email', 'message']) if (!field(k)) fields[k] = 'required';
  if (field('email') && !EMAIL_RE.test(field('email')!)) fields.email = 'invalid';
  for (const [k, max] of Object.entries(LIMITS)) if ((field(k)?.length ?? 0) > max) fields[k] = 'too_long';
  if (field('contact_reason') && !REASONS.has(field('contact_reason')!)) fields.contact_reason = 'invalid';
  if (field('lot_id') && !field('development_id')) fields.lot_id = 'invalid';
  if (Object.keys(fields).length) return respond(400, { code: 'invalid', fields }, 'error');

  if (env('SITE_MODE') === 'preview') return respond(200, { preview: true }, 'preview');

  const input: Record<string, unknown> = { name: field('name'), email: field('email'), message: field('message') };
  for (const k of PASSED) if (field(k)) input[k] = field(k);
  input.page_url ??= request.headers.get('referer') ?? undefined;
  const token = field('cf-turnstile-response') ?? field('turnstile_token');
  if (token) input.turnstile_token = token;
  const clientIp =
    request.headers.get('cf-connecting-ip')?.trim() || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;

  const send = (ra as SitesClient & { [SEND]?: Send })[SEND];
  if (!send) throw new TypeError('handleEnquiry needs a client from createClient');
  try {
    const { id } = await send(input, clientIp);
    return respond(200, { id }, 'sent');
  } catch (err) {
    if (!(err instanceof SitesApiError)) throw err;
    if (err.code === 'unavailable' || err.code === 'site_key') console.error(`[sites-sdk] enquiry: ${err.message}`);
    return respond(STATUS[err.code], { code: err.code, ...(err.fields ? { fields: err.fields } : {}) }, 'error');
  }
};

/** turnstileSiteKey() of a fixture: the form renders a stand-in widget and never loads Turnstile. */
export const FIXTURE_TURNSTILE_SITE_KEY = 'fixture';

/** The language of a locale (`de-CH` → `de`), as rest-api reads it. */
const languageOf = (locale?: string): string | undefined => locale?.trim().toLowerCase().split(/[-_]/)[0] || undefined;

const plainText = (html: string): string =>
  html
    .replace(/<\/(p|li|h3|h4)>|<br\s*\/?>/gi, '$& ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

type Texts = { title?: string; description?: string; description_text?: string; text_locale?: string };

/**
 * A fixture record as the API serves it in `locale`: its `translations` in
 * that language replace the title (listings) and the description (a unit's
 * only when it has one: live units), `text_locale` set when every text
 * served is translated. `translations` never leaves the client.
 */
const inLocale = <T extends Texts>(
  { translations, ...rest }: T & FixtureTranslations,
  locale: string | undefined,
  kind: 'listing' | 'unit',
): T => {
  const record = rest as unknown as T;
  const lang = languageOf(locale);
  const t = lang ? translations?.[lang] : undefined;
  if (!lang || !t) return record;
  const out: T = { ...record };
  const title = kind === 'listing' && !!t.title;
  const description = !!t.description && (kind === 'listing' || record.description !== undefined);
  if (title) out.title = t.title;
  if (description) {
    out.description = t.description;
    out.description_text = t.description_text ?? plainText(t.description!);
  }
  const translated = (kind === 'unit' || title) && (description || out.description === undefined);
  if (translated && (title || description)) out.text_locale = lang;
  return out;
};

const fold = (s = ''): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/**
 * A SitesClient that answers from a fixture instead of rest-api: the same
 * interface and the same filters as createClient, so a page written against
 * it runs unchanged on live data. For `pnpm dev`, builds and tests without a
 * key. It sends nothing: handleEnquiry refuses it.
 */
export const createFixtureClient = (fx: Fixture): SitesClient => {
  const match = (l: Listing, q: ListingsQuery) =>
    (!q.team_id || l.team_ids.includes(q.team_id)) &&
    (!q.offer_type || l.offer_type === q.offer_type) &&
    (!q.property_type || l.property_type === q.property_type || l.property_type.startsWith(`${q.property_type}_`)) &&
    (!q.status || l.status === q.status) &&
    (!q.city || fold(l.address.city) === fold(q.city)) &&
    (q.min_price == null || (l.price != null && l.price >= q.min_price)) &&
    (q.max_price == null || (l.price != null && l.price <= q.max_price)) &&
    (q.min_rooms == null || (l.rooms != null && l.rooms >= q.min_rooms));
  // Newest first, as rest-api lists them.
  const found = (q: ListingsQuery) =>
    [...fx.listings]
      .sort((a, b) => b.published_at.localeCompare(a.published_at))
      .filter(l => match(l, q))
      .map(l => inLocale<Listing>(l, q.locale, 'listing'));
  const listings = async (q: ListingsQuery = {}): Promise<Page<Listing>> => {
    const all = found(q);
    const limit = Math.min(Math.max(Math.trunc(q.limit ?? 24), 1), 200);
    const offset = Math.max(Math.trunc(q.offset ?? 0), 0);
    const data = all.slice(offset, offset + limit);
    return { data, pagination: { limit, offset, total: all.length, total_is_capped: false, has_more: offset + data.length < all.length } };
  };
  const developments = (q: TextQuery = {}): DevelopmentWithUnits[] =>
    (fx.developments ?? []).map(d => ({ ...d, units: d.units.map(u => inLocale<Unit>(u, q.locale, 'unit')) }));
  const strip = ({ units: _units, ...d }: DevelopmentWithUnits): Development => d;
  const byKey = <T extends { id: string; slug: string }>(arr: T[], s: string) => {
    const id = s.match(UUID_RE)?.[0].toLowerCase();
    return arr.find(x => x.slug === s || x.id === s || (!!id && x.id === id)) ?? null;
  };
  return {
    organisation: async () => fx.organisation,
    teams: async () => fx.teams,
    agents: async (q = {}) => (q.team_id ? fx.agents.filter(a => a.team_ids.includes(q.team_id!)) : fx.agents),
    listings,
    allListings: async (q = {}) => found(q),
    listing: async (s, q = {}) => {
      const l = byKey(fx.listings, s);
      return l && inLocale<Listing>(l, q.locale, 'listing');
    },
    developments: async (q = {}) => developments(q).filter(d => !q.team_id || d.team_ids.includes(q.team_id)).map(strip),
    development: async (s, q = {}) => byKey(developments(q), s),
    turnstileSiteKey: async () => (fx.turnstile_site_key === undefined ? FIXTURE_TURNSTILE_SITE_KEY : fx.turnstile_site_key),
  };
};
