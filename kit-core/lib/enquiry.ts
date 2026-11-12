/**
 * The enquiry endpoint behind <EnquiryForm>, for both kits. Astro,
 * src/pages/api/enquiry.ts:
 *
 *   import { enquiryAction } from '@realadvisor/sites-kit-core/enquiry';
 *   import { ra } from '@realadvisor/sites-kit-astro/ra';
 *   export const prerender = false;
 *   export const POST: APIRoute = ({ request }) => enquiryAction(request, ra);
 *
 * React Router: `enquiryAction(request, sites)` (sites-kit-react/server/enquiry).
 *
 * Form data or JSON with name, email, message (required), phone,
 * listingId, agentId, developmentId, lotId, contactReason, locale,
 * idempotencyKey, turnstileToken (or cf-turnstile-response), pageUrl, redirect.
 *
 * - `Accept: application/json`: 200 {id, preview?} | 400 {error:'invalid', fields}
 *   | 403 {error:'verification_required', message} | 400 {error:'rejected', message}
 *   | 429 {error:'rate_limited'} | 503 {error:'unavailable', reason:'site_key'} | 502.
 * - Otherwise: 303 back to `redirect` with ?enquiry=sent|preview|error.
 *
 * A development enquiry must name a unit (lotId) while the development has
 * one to ask about (available or reserved): 400 {fields: {lotId: 'required'}}.
 * Preview sites (SITE_MODE=preview) and fixture mode never deliver. Live
 * sites send through the SDK's handleEnquiry (rest-api verifies Turnstile).
 */
import { handleEnquiry } from '@realadvisor/sites-sdk';
import type { SitesClient } from '@realadvisor/sites-sdk/types';
import { siteMode } from './env';
import { lang, t } from './i18n';
import { LOCALE } from './format';
import { SITE_KEY_REJECTED } from './render-error';

/** What the endpoint reads: the site's client (`ra`, or the React kit's `sites`). */
export type EnquiryClient = Pick<SitesClient, 'development'> & { live(): SitesClient | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REASONS = ['buy', 'sell', 'valuation', 'other'] as const;
const LIMITS = { name: 100, email: 200, phone: 40, message: 5000 } as const;
/** The form's field names -> rest-api's (what handleEnquiry reads). */
const WIRE: Record<string, string> = {
  phone: 'phone',
  listingId: 'listing_id',
  agentId: 'agent_id',
  developmentId: 'development_id',
  lotId: 'lot_id',
  contactReason: 'contact_reason',
  locale: 'locale',
  pageUrl: 'page_url',
  idempotencyKey: 'idempotency_key',
  turnstileToken: 'turnstile_token',
};
const FROM_WIRE = Object.fromEntries(Object.entries(WIRE).map(([k, v]) => [v, k]));

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(json).filter((e): e is [string, string] => typeof e[1] === 'string'));
  }
  const form = await request.formData().catch(() => null);
  const out: Record<string, string> = {};
  for (const [k, v] of form ?? []) if (typeof v === 'string') out[k] = v;
  return out;
}

/** True when the development has a unit a visitor can ask about. Lookup failure: false (never lose an enquiry). */
async function hasEnquirableUnits(sites: EnquiryClient, developmentId: string): Promise<boolean> {
  try {
    const dev = await sites.development(developmentId);
    return !!dev?.units.some((u) => u.status !== 'sold');
  } catch (err) {
    console.error('[enquiry] development lookup failed', err);
    return false;
  }
}

export async function enquiryAction(request: Request, sites: EnquiryClient): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });
  const body = await readBody(request);
  const field = (k: string) => body[k]?.trim() || undefined;
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const url = new URL(request.url);
  const back = field('redirect') ?? '/';
  const respond = (status: number, json: Record<string, unknown>, state: 'sent' | 'preview' | 'error') => {
    if (wantsJson) return Response.json(json, { status });
    // Only same-site relative redirects; the state goes before the #anchor.
    const target = new URL(back.startsWith('/') && !back.startsWith('//') ? back : '/', url);
    target.searchParams.set('enquiry', state);
    return new Response(null, { status: 303, headers: { location: target.pathname + target.search + target.hash } });
  };

  const fields: Record<string, string> = {};
  const name = field('name');
  const email = field('email');
  const message = field('message');
  if (!name) fields.name = 'required';
  if (!email) fields.email = 'required';
  else if (!EMAIL_RE.test(email)) fields.email = 'invalid';
  if (!message) fields.message = 'required';
  for (const [k, max] of Object.entries(LIMITS)) if ((field(k)?.length ?? 0) > max) fields[k] = 'too_long';
  const reason = field('contactReason');
  if (reason && !(REASONS as readonly string[]).includes(reason)) fields.contactReason = 'invalid';
  if (field('lotId') && !field('developmentId')) fields.lotId = 'invalid';
  const developmentId = field('developmentId');
  if (developmentId && !field('lotId') && (await hasEnquirableUnits(sites, developmentId))) fields.lotId = 'required';
  if (Object.keys(fields).length) {
    const unit = fields.lotId === 'required' ? { message: t('unitRequired', {}, lang(field('locale'))) } : {};
    return respond(400, { error: 'invalid', fields, ...unit }, 'error');
  }

  const input: Record<string, string> = { name: name!, email: email!, message: message! };
  for (const [k, wire] of Object.entries(WIRE)) {
    const v = k === 'turnstileToken' ? field('turnstileToken') ?? field('cf-turnstile-response') : field(k);
    if (v) input[wire] = v;
  }
  // Listing and unit enquiries carry no reason: the lot is the intent.
  if (input.listing_id || input.lot_id) delete input.contact_reason;
  input.locale ??= LOCALE;
  input.page_url ??= request.headers.get('referer') ?? '';
  if (!input.page_url) delete input.page_url;

  const live = sites.live();
  if (siteMode() === 'preview' || !live) {
    console.log('[enquiry] preview site, not sent', { ...input, turnstile_token: input.turnstile_token ? '(set)' : undefined });
    return respond(200, { id: 'preview', preview: true }, 'preview');
  }

  const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' });
  for (const h of ['cf-connecting-ip', 'x-forwarded-for', 'referer']) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  let res: Response;
  try {
    res = await handleEnquiry(new Request(url, { method: 'POST', headers, body: JSON.stringify(input) }), live);
  } catch (err) {
    console.error('[enquiry] send failed', err);
    return respond(502, { error: 'unavailable' }, 'error');
  }
  const out = (await res.json().catch(() => ({}))) as { id?: string; preview?: boolean; code?: string; fields?: Record<string, string> };
  if (res.ok) return respond(200, { id: out.id ?? 'preview', ...(out.preview ? { preview: true } : {}) }, out.preview ? 'preview' : 'sent');
  const l = lang(field('locale'));
  switch (out.code) {
    case 'verification_required':
      return respond(403, { error: 'verification_required', message: t('verifyFailed', {}, l) }, 'error');
    case 'rejected':
      console.warn('[enquiry] rejected by the CRM');
      return respond(400, { error: 'rejected', message: t('rejected', {}, l) }, 'error');
    case 'invalid': {
      const named = Object.fromEntries(Object.entries(out.fields ?? {}).map(([k, v]) => [FROM_WIRE[k] ?? k, v]));
      return respond(400, { error: 'invalid', fields: named }, 'error');
    }
    case 'rate_limited':
      return respond(429, { error: 'rate_limited' }, 'error');
    case 'site_key':
      console.error(JSON.stringify({ level: 'error', msg: `[enquiry] ${SITE_KEY_REJECTED}` }));
      return respond(503, { error: 'unavailable', reason: 'site_key' }, 'error');
    default:
      return respond(502, { error: 'unavailable' }, 'error');
  }
}
