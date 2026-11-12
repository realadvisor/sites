/** Content blocks (content.server.ts) as React elements: no HTML strings. */
import type { Block, Span } from '../content/content.server';

const spans = (text: Span[]) => text.map((s, i) => (s.s === 'strong' ? <strong key={i}>{s.t}</strong> : s.s === 'em' ? <em key={i}>{s.t}</em> : s.t));

export function Markdown({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((b, i) => (b.type === 'h2' ? <h2 key={i} id={b.id}>{spans(b.text)}</h2> : <p key={i}>{spans(b.text)}</p>))}</>;
}
