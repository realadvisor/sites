/**
 * One office: city photo, name, address, phone, figures from the data
 * (advisors, listings), link to the office page.
 */
import type { Team } from '@realadvisor/sites-sdk/types';
import { href, type L } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import { officePlace, placeAlt } from '../content/places';
import { PlacePhoto } from './PlacePhoto';
import './OfficeCard.css';

type Props = { team: Team; slug: string; agents: number; listings: number; l: L; as?: 'h2' | 'h3'; priority?: boolean };

export function OfficeCard({ team, slug, agents, listings, l, as: H = 'h3', priority = false }: Props) {
  const t = tx(l);
  const place = officePlace(team.address.city);
  const city = cityName(team.address.city, l) || team.name;
  return (
    <article className="oc">
      <a className="oc__media" href={href('offices', l, slug)} tabIndex={-1} aria-hidden="true">
        {place
          ? <PlacePhoto place={place} alt={placeAlt(place, l)} width={800} height={560} sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, calc(100vw - 32px)" priority={priority} widths={priority ? [480, 800, 1000] : undefined} />
          : <span className="oc__ph">{city}</span>}
      </a>
      <div className="oc__body">
        <H className="oc__city"><a href={href('offices', l, slug)}>{city}</a></H>
        <address>
          {team.address.street && <span>{team.address.street}</span>}
          {(team.address.postcode || team.address.city) && <span>{[team.address.postcode, cityName(team.address.city, l)].filter(Boolean).join(' ')}</span>}
        </address>
        {team.phone && <a className="oc__tel num" href={tel(team.phone)}>{team.phone}</a>}
        <p className="oc__figs num">
          {agents > 0 && <span>{agents === 1 ? t('nAgent1') : t('nAgents', { n: agents })}</span>}
          {listings > 0 && <span>{listings === 1 ? t('nListing1') : t('nListings', { n: listings })}</span>}
        </p>
        <a className="link" href={href('offices', l, slug)}>{t('visitOffice')}<span className="sr-only"> {city}</span></a>
      </div>
    </article>
  );
}
