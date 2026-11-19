/**
 * The answer when a page fails to render (the kit middleware): the error goes
 * to the Worker logs as one `site_error` line (lib/site-error.ts), the
 * visitor gets a short 500 page that no cache keeps, never an empty 200. The
 * page is in the language of the path (`/en/...` on a multilingual site),
 * else the site's (site.json `locale`), else English.
 * `notFoundPage` is the last-resort 404/410 when even the site's /404 page
 * cannot render: a missing page is never reported as a 500.
 * A rejected site key (`code: 'site_key'`: the key was revoked or replaced)
 * is logged as such: only a republish fixes it.
 */
import { lang, localeOfPath, t } from './i18n';
import { logSiteError } from './site-error';

export { SITE_ERROR_EVENT, SITE_KEY_REJECTED } from './site-error';

const TEXT = {
  de: ['Seite vorübergehend nicht verfügbar', 'Bitte versuchen Sie es in einigen Minuten erneut.', 'Zur Startseite'],
  fr: ['Page momentanément indisponible', 'Merci de réessayer dans quelques minutes.', "Retour à l'accueil"],
  it: ['Pagina momentaneamente non disponibile', 'Riprovi tra qualche minuto.', 'Torna alla home'],
  es: ['Página no disponible por el momento', 'Inténtelo de nuevo en unos minutos.', 'Volver al inicio'],
  en: ['Page temporarily unavailable', 'Please try again in a few minutes.', 'Back to home'],
} as const;

/** Title, text and home-link label of the 500 page in a language (a framework's own error page uses them too). */
export const serverErrorText = (l: keyof typeof TEXT = lang()) => {
  const [title, body, home] = TEXT[l];
  return { title, body, home };
};

/**
 * Logs the failure and answers the 500 page. `host`: the request's host, for
 * the log line.
 */
export function renderFailed(path: string, err: unknown, host?: string): Response {
  logSiteError('page', err, { status: 500, path, host });
  const l = lang(localeOfPath(path));
  const [title, body, home] = TEXT[l];
  return new Response(page(l, title, body, home), {
    status: 500,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '60' },
  });
}

const page = (l: string, title: string, body: string, home: string) =>
  `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:36rem;margin:15vh auto;padding:0 1.5rem;color:#222}a{color:inherit}</style></head><body><h1>${title}</h1><p>${body}</p><p><a href="/">${home}</a></p></body></html>`;

/** Plain not-found page (404, or 410 for a listing that left the site) in the path's language. */
export function notFoundPage(path: string, status: 404 | 410 = 404): Response {
  const l = lang(localeOfPath(path));
  const title = t(status === 410 ? 'listingGone' : 'notFound', {}, l);
  const body = t(status === 410 ? 'listingGoneText' : 'notFoundText', {}, l);
  return new Response(page(l, title, body, t('home', {}, l)), {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
