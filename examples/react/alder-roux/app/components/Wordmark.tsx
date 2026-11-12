/**
 * Text wordmark: the organisation has no logo file in the data. The name is
 * split at its legal suffix ("Immobilier SA") into a serif name and a small
 * caps line. A logo in the data replaces it.
 */
import { img } from '@realadvisor/sites-kit-core/image';
import type { Organisation } from '@realadvisor/sites-sdk/types';
import './Wordmark.css';

type Props = { org: Pick<Organisation, 'name' | 'logo'>; href: string; tone?: 'dark' | 'light'; label: string };

export function Wordmark({ org, href, tone = 'dark', label }: Props) {
  const m = org.name.match(/^(.*?)\s+((?:Immobilier|Immobilien|Real Estate)\b.*)$/i);
  const name = m?.[1] ?? org.name;
  const sub = m?.[2];
  const [a, b] = name.includes('&') ? name.split(/\s*&\s*/, 2) : [name, undefined];
  return (
    <a className={`wm wm--${tone}`} href={href} aria-label={label}>
      {org.logo?.url ? (
        <img data-logo="" src={img(org.logo.url, { w: 360, fit: 'fit', quality: 90 })} alt={org.name} height={40} />
      ) : (
        <span className="wm__text" aria-hidden="true">
          <span className="wm__name">{a}{b && <><span className="wm__amp">&amp;</span>{b}</>}</span>
          {sub && <span className="wm__sub">{sub}</span>}
        </span>
      )}
    </a>
  );
}
