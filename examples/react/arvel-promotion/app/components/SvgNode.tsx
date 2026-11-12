/** Renders a plans.ts element tree as inline SVG (React elements, no HTML string). */
import { createElement, type ReactNode } from 'react';
import type { Node } from '../lib/plans';

// SVG attribute names as React props: stroke-width -> strokeWidth (aria-* stay as they are).
const prop = (k: string) => (k.startsWith('aria-') ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));

export function SvgNode({ node }: { node: Node | string }): ReactNode {
  if (typeof node === 'string') return node;
  const attrs: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(node.a ?? {})) {
    if (node.t === 'svg' && (k === 'width' || k === 'height')) continue;
    attrs[prop(k)] = v;
  }
  return createElement(node.t, attrs, ...(node.c ?? []).map((c, i) => <SvgNode key={i} node={c} />));
}
