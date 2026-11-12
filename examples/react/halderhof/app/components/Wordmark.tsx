/**
 * Text wordmark: the organisation has no logo file in the data. The name is
 * split at its legal part ("Immobilien AG") into a serif name and a small
 * second line. A logo in the data replaces it.
 */
import { img } from '@realadvisor/sites-kit/image';
import './Wordmark.css';

export function Wordmark({ org, href, label }: { org: { name: string; logo?: { url: string } | null }; href: string; label: string }) {
  const m = org.name.match(/^(.*?)\s+((?:Immobilier|Immobilien|Real Estate)\b.*)$/i);
  const name = m?.[1] ?? org.name;
  const sub = m?.[2];
  return (
    <a className="wm" href={href} aria-label={label}>
      {org.logo?.url ? (
        <img data-logo="" src={img(org.logo.url, { w: 360, fit: 'fit', quality: 90 })} alt={org.name} height={40} />
      ) : (
        <span className="wm__text" aria-hidden="true">
          <span className="wm__name">{name}</span>{' '}
          {sub && <span className="wm__sub">{sub}</span>}
        </span>
      )}
    </a>
  );
}
