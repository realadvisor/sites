/**
 * A React island: the component renders on the server (its own useId prefix)
 * and hydrates alone in the browser, when visible (default), idle or at load,
 * through `islands()` in app/client.ts. The rest of the page stays static
 * HTML: no React Router runtime, no inline script (props go in data-props).
 *
 *   <Island name="OfferTabs" component={OfferTabs} props={{ title, panels }} />
 *   // app/client.ts
 *   islands({ OfferTabs: () => import('./components/OfferTabs') });
 *
 * Props must be JSON (no functions, no Dates); the island must not import
 * server code (data clients, secrets).
 */
import { createElement, useId, type ComponentType } from 'react';
import { renderToString } from 'react-dom/server';

export type IslandProps<P extends object> = {
  /** Key in the islands() loader map. */
  name: string;
  component: ComponentType<P>;
  props: P;
  when?: 'visible' | 'idle' | 'load';
};

export function Island<P extends object>({ name, component, props, when = 'visible' }: IslandProps<P>) {
  // A stable, unique prefix per island on the page (React's own id of this element).
  const prefix = `${name}-${useId().replace(/[^a-zA-Z0-9]/g, '')}-`;
  const html = renderToString(createElement(component, props), { identifierPrefix: prefix });
  return (
    <div
      data-island={name}
      data-when={when}
      data-prefix={prefix}
      data-props={JSON.stringify(props)}
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
