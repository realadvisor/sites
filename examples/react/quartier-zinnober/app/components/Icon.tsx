/** Inline line icons (24px grid, lucide style), rendered on the server: no icon font, no JS. */
const PATHS = {
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  train: '<rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16"/><path d="M8 21l2-4"/><path d="M16 21l-2-4"/><circle cx="8.5" cy="14" r=".6"/><circle cx="15.5" cy="14" r=".6"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 10h16"/><path d="M7 21v-3M17 21v-3"/><circle cx="8" cy="14" r=".6"/><circle cx="16" cy="14" r=".6"/>',
  factory: '<path d="M2 21h20"/><path d="M3 21V10l6 4v-4l6 4V4h4v17"/><path d="M8 17h2M13 17h2"/>',
  town: '<path d="M3 21h18"/><path d="M5 21V9l4-4 4 4v12"/><path d="M13 21v-8h6v8"/><path d="M8 13h2M8 17h2"/>',
  bike: '<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M15 6h2l3 11"/><path d="M5.5 17 9 9h7l-4 8"/>',
  school: '<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
  tree: '<path d="M12 22v-6"/><path d="M12 2 5 12h4l-3 4h12l-3-4h4Z"/>',
  car: '<path d="M5 17h14v-5l-2-5H7l-2 5Z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  expand: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
} as const;
export type IconName = keyof typeof PATHS;

// The shapes as elements (no dangerouslySetInnerHTML): tag name and attributes.
const SHAPES = Object.fromEntries(
  Object.entries(PATHS).map(([k, v]) => [
    k,
    [...v.matchAll(/<(path|circle|rect) ([^>]*?)\/>/g)].map(([, tag, attrs]) => ({
      tag: tag as 'path' | 'circle' | 'rect',
      attrs: Object.fromEntries([...attrs!.matchAll(/([a-z]+)="([^"]*)"/g)].map(([, a, b]) => [a!, b!])),
    })),
  ]),
) as Record<IconName, { tag: 'path' | 'circle' | 'rect'; attrs: Record<string, string> }[]>;

export function Icon({ name, size = 20, className, label }: { name: IconName; size?: number; className?: string; label?: string }) {
  return (
    <svg
      className={['icon', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {SHAPES[name].map(({ tag: Tag, attrs }, i) => <Tag key={i} {...attrs} />)}
    </svg>
  );
}
