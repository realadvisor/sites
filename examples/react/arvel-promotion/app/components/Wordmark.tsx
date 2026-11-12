/**
 * Typographic wordmark: the organisation has no logo in the data, so the
 * name is set in the display serif (first word) over spaced caps (the rest).
 * With `agency.logo` a site uses the logo instead (DESIGN.md 4).
 */
import './Wordmark.css';

export function Wordmark({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const [first, ...rest] = name.replace(/\s+(SAS|SA|SARL|SNC)$/i, '').split(/\s+/);
  return (
    <span className={`wm wm--${size}`}>
      <span className="wm-a">{first}</span>
      {rest.length > 0 && <span className="wm-b">{rest.join(' ')}</span>}
    </span>
  );
}
