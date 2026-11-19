/**
 * The site's server entry: app/entry.server.tsx re-exports it.
 *
 *   export { default, streamTimeout } from '@realadvisor/sites-kit-react/entry.server';
 *
 * Renders with the request nonce (from the Worker, `loadContext.nonce`):
 * renderToReadableStream({ nonce }), <ServerRouter nonce> (its inline
 * hydration data) and NonceContext for <KitScripts>, <JsonLd> and any
 * inline script a page adds. Always waits for the whole page (allReady):
 * the Worker answers complete pages only (a render error is a 500, never a
 * cut 200), crawlers and Lighthouse see the final HTML.
 *
 * `handleError` logs a loader, action or render error as one `site_error`
 * line (kit-core lib/site-error.ts: a rejected site key has `code:
 * 'site_key'`). A site re-exports it with the rest:
 *
 *   export { default, handleError, streamTimeout } from '@realadvisor/sites-kit-react/entry.server';
 */
import type { AppLoadContext, EntryContext, HandleErrorFunction } from 'react-router';
import { isRouteErrorResponse } from 'react-router';
import { logSiteError } from '@realadvisor/sites-kit-core/site-error';
import { ServerRouter } from 'react-router';
import { renderToReadableStream } from 'react-dom/server';
import { NonceContext } from '../components/Document';

export const streamTimeout = 8000;

export const handleError: HandleErrorFunction = (error, { request, context }) => {
  // A cancelled request is not a failure; a thrown 404/410 is the not-found page.
  if (request.signal.aborted) return;
  if (isRouteErrorResponse(error) && error.status < 500) return;
  const status = (error as { status?: unknown } | null)?.status;
  if (status === 404 || status === 410) return;
  const url = new URL(request.url);
  logSiteError('page', error, { status: 500, path: url.pathname, host: url.host });
  if (context && typeof context === 'object') (context as { errorLogged?: boolean }).errorLogged = true;
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
) {
  const nonce = (loadContext as { nonce?: string }).nonce;
  let failed: unknown;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), streamTimeout + 1000);
  try {
    const body = await renderToReadableStream(
      <NonceContext.Provider value={nonce}>
        <ServerRouter context={routerContext} url={request.url} nonce={nonce} />
      </NonceContext.Provider>,
      {
        nonce,
        signal: controller.signal,
        onError(error: unknown) {
          failed ??= error;
          // Logged by the Worker's handler too; a shell error rejects below.
          if (!controller.signal.aborted) console.error('[render]', error);
        },
      },
    );
    await body.allReady;
    // An error inside a Suspense boundary still resolves allReady: the page is incomplete.
    if (failed && responseStatusCode < 400) throw failed;
    responseHeaders.set('content-type', 'text/html; charset=utf-8');
    return new Response(body, { headers: responseHeaders, status: responseStatusCode });
  } finally {
    clearTimeout(timer);
  }
}
