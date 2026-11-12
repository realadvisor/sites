/** Thin arrow for text links (decorative). */
export function Arrow({ dir = 'right' }: { dir?: 'right' | 'down' | 'left' }) {
  const r = { right: 0, down: 90, left: 180 }[dir];
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true" style={r ? { transform: `rotate(${r}deg)` } : undefined}>
      <path d="M0 5h16.5M12.5 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
