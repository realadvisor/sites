/** The development's wordmark (the CRM has no logo): a zinnober tile and the name in the display face. */
import './Wordmark.css';

export function Wordmark({ tone = 'ink' }: { tone?: 'ink' | 'light' }) {
  return (
    <span className={`wm wm--${tone}`}>
      <span className="tile" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="40" height="40"><rect width="32" height="32" rx="7" fill="#E4572E" /><path d="M9 9h14v3L13.5 20H23v3H9v-3l9.5-8H9Z" fill="#140F3A" /></svg>
      </span>
      <span className="words"><span className="q">Quartier</span><span className="z">Zinnober</span></span>
    </span>
  );
}
