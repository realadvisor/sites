/** Recently sold, as a plain list: small photo, title, place and facts. No cards, no price. */
import type { Listing } from '@realadvisor/sites-sdk/types';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { listingUrl } from '../lib/urls';
import { facts, kind } from '../lib/format';
import './SoldList.css';

export function SoldList({ listings }: { listings: Listing[] }) {
  return (
    <ul className="sl">
      {listings.map((l) => (
        <li key={l.id}>
          <a className="sl-row" href={listingUrl(l)}>
            <span className="sl-media">{l.photos[0] && <RaImage src={l.photos[0]} alt="" width={160} height={120} sizes="96px" />}</span>
            <span className="sl-body">
              <span className="sl-title">{l.title}</span>
              <span className="sl-meta muted">{kind(l)}{facts(l) && <> · <span className="num">{facts(l)}</span></>}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
