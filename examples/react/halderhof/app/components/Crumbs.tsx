/** Breadcrumb trail; the last item is the current page. */
import './Crumbs.css';

export type Crumb = { label: string; href?: string };

export function Crumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav className="crumbs" aria-label={label}>
      <ol>
        {items.map((x, i) => (
          <li key={i}>{x.href && i < items.length - 1 ? <a href={x.href}>{x.label}</a> : <span aria-current="page">{x.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
