type Props = { items: { label: string; href?: string }[]; label: string };

export function Crumbs({ items, label }: Props) {
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
