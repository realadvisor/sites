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
 */
import type { AppLoadContext, EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';
import { renderToReadableStream } from 'react-dom/server';
import { NonceContext } from '../components/Document';

export const streamTimeout = 8000;

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
