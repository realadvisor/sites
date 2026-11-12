/** Markdown blocks of the site's content (journal, districts) as React elements. */
import type { Block } from '../content/content.server';

export function Prose({ blocks, className = 'prose' }: { blocks: Block[]; className?: string }) {
  return (
    <div className={className}>
      {blocks.map((b, i) =>
        b.type === 'h2' ? <h2 key={i} id={b.id}>{b.text}</h2> : (
          <p key={i}>{b.text.map((r, j) => (r.strong ? <strong key={j}>{r.text}</strong> : r.text))}</p>
        ),
      )}
    </div>
  );
}
