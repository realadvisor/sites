/** Breadcrumb trail: links, the last item is the current page. */
import './Crumbs.css';

export type Crumb = { label: string; href?: string };

export function Crumbs({ label, items, tone = 'dark' }: { label: string; items: Crumb[]; tone?: 'dark' | 'light' }) {
  return (
    <nav className={`crumbs crumbs--${tone}`} aria-label={label}>
      <ol className="plain">
        {items.map((x, i) => (
          <li key={i}>{x.href && i < items.length - 1 ? <a href={x.href}>{x.label}</a> : <span aria-current={i === items.length - 1 ? 'page' : undefined}>{x.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
