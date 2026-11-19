// The 500 page and its log line (lib/render-error.ts, lib/site-error.ts):
// `pnpm test`. A Spanish site with an English section stands in for
// virtual:sites-kit/site (the build's site.json), registered before the
// kit modules load.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

const SITE = { country: 'ES', locale: 'es-ES', locales: ['es-ES', 'en-ES'], developmentsPath: '/developments', redirects: {} };
const hooks = `
export async function resolve(specifier, context, next) {
  if (specifier === 'virtual:sites-kit/site') {
    return { url: 'data:text/javascript,export default ' + encodeURIComponent(${JSON.stringify(JSON.stringify(SITE))}), shortCircuit: true };
  }
  // The kit's own imports have no extension (a bundler resolves them).
  if (specifier.startsWith('./') && !/\\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL?.includes('/kit-core/lib/')) {
    return next(specifier + '.ts', context);
  }
  return next(specifier, context);
}`;
register(`data:text/javascript,${encodeURIComponent(hooks)}`, import.meta.url);

const { renderFailed, serverErrorText, SITE_KEY_REJECTED } = await import('../lib/render-error.ts');
const { siteErrorLine, SITE_ERROR_EVENT } = await import('../lib/site-error.ts');
const { setRuntimeEnv } = await import('../lib/env.ts');

/** A SitesApiError as the SDK throws it (matched by shape: a second SDK copy is not the same class). */
const apiError = (code: string, status: number) => Object.assign(new Error(`sites API answered ${status}`), { name: 'SitesApiError', code, status });

/** Runs fn with console.error captured; returns the parsed JSON lines. */
const capture = async (fn: () => unknown) => {
  const lines: unknown[] = [];
  const original = console.error;
  console.error = (line: unknown) => lines.push(JSON.parse(String(line)));
  try {
    await fn();
  } finally {
    console.error = original;
  }
  return lines as Array<Record<string, unknown>>;
};

describe('renderFailed', () => {
  before(() => setRuntimeEnv({ SITE_SLUG: 'milestone-properties', SITE_WORKER: 'ra-site-milestone-properties-5845' }));
  after(() => setRuntimeEnv({}));

  it('answers a 500 in the site language (site.json locale), never cached', async () => {
    let res!: Response;
    await capture(() => (res = renderFailed('/', apiError('site_key', 401), 'www.example.es')));
    assert.equal(res.status, 500);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    const html = await res.text();
    assert.match(html, /<html lang="es">/);
    assert.match(html, /Página no disponible por el momento/);
    assert.doesNotMatch(html, /momentanément/);
  });

  it('answers in the language of the path on a multilingual site', async () => {
    let res!: Response;
    await capture(() => (res = renderFailed('/en/listings', new Error('boom'))));
    const html = await res.text();
    assert.match(html, /<html lang="en">/);
    assert.match(html, /Page temporarily unavailable/);
  });

  it('logs one site_error line for a rejected site key, with site, worker, host and statuses', async () => {
    const lines = await capture(() => renderFailed('/listings', apiError('site_key', 401), 'www.example.es'));
    assert.equal(lines.length, 1);
    assert.deepEqual(
      { ...lines[0], error: undefined },
      {
        level: 'error',
        event: 'site_error',
        source: 'page',
        code: 'site_key',
        status: 500,
        api_status: 401,
        site: 'milestone-properties',
        worker: 'ra-site-milestone-properties-5845',
        host: 'www.example.es',
        path: '/listings',
        msg: `page render failed: ${SITE_KEY_REJECTED}`,
        error: undefined,
      },
    );
  });

  it('logs any other render failure with the same event, code render and a stack', async () => {
    const [line] = await capture(() => renderFailed('/', new TypeError("Cannot read properties of undefined (reading 'url')")));
    assert.equal(line!.event, SITE_ERROR_EVENT);
    assert.equal(line!.code, 'render');
    assert.equal(line!.api_status, null);
    assert.equal(line!.msg, 'page render failed');
    assert.match(String(line!.stack), /TypeError/);
  });
});

describe('serverErrorText', () => {
  it('has fr, de, it, es and en, and English for any other language', async () => {
    const { lang } = await import('../lib/i18n.ts');
    assert.equal(serverErrorText('fr').title, 'Page momentanément indisponible');
    assert.equal(serverErrorText('de').title, 'Seite vorübergehend nicht verfügbar');
    assert.equal(serverErrorText('it').title, 'Pagina momentaneamente non disponibile');
    assert.equal(serverErrorText('es').title, 'Página no disponible por el momento');
    assert.equal(serverErrorText(lang('pt-PT')).title, 'Page temporarily unavailable');
    assert.equal(serverErrorText().title, 'Página no disponible por el momento', 'default: the site locale');
  });
});

describe('siteErrorLine', () => {
  it('has null site and worker when the publish set neither', () => {
    const line = siteErrorLine('enquiry', apiError('site_key', 0), { status: 503, path: '/api/enquiry' });
    assert.equal(line.site, null);
    assert.equal(line.worker, null);
    assert.equal(line.api_status, null);
    assert.equal(line.msg, `[enquiry] refused: ${SITE_KEY_REJECTED}`);
  });

  it('never carries the site key', () => {
    setRuntimeEnv({ SITES_API_KEY: 'ra_site_secret_value' });
    const line = JSON.stringify(siteErrorLine('page', apiError('site_key', 401), { status: 500 }));
    setRuntimeEnv({});
    assert.doesNotMatch(line, /ra_site_secret_value/);
  });
});
