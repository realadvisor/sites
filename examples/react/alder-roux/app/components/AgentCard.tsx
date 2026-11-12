/**
 * One advisor in plain type: name, role and office, languages, phone and
 * email. A real photo from the data is shown when there is one; no initials.
 */
import type { Agent, Team } from '@realadvisor/sites-sdk/types';
import { Img } from './Img';
import { href, type L } from '../lib/routes';
import { cityName, langName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './AgentCard.css';

type Props = { agent: Agent; slug: string; team?: Team; l: L; as?: 'h2' | 'h3' };

export function AgentCard({ agent: a, slug, team, l, as: H = 'h3' }: Props) {
  const t = tx(l);
  const langs = (a.languages ?? []).map((x) => langName(x, l));
  return (
    <article className={a.photo?.url ? 'ag ag--photo' : 'ag'}>
      {a.photo?.url && <Img className="ag__photo" src={a.photo} alt={`${a.first_name} ${a.last_name}`} width={160} height={200} sizes="80px" />}
      <div className="ag__body">
        <H className="ag__name"><a href={href('team', l, slug)}>{a.first_name} {a.last_name}</a></H>
        {(a.title || team) && <p className="ag__role">{[a.title, team && t('officeOf', { city: cityName(team.address.city, l) || team.name })].filter(Boolean).join(' · ')}</p>}
        {langs.length > 0 && <p className="ag__langs">{t('speaks', { langs: langs.join(', ') })}</p>}
        <ul className="ag__contact">
          {a.phone && <li><a className="num" href={tel(a.phone)}>{a.phone}</a></li>}
          {a.email && <li><a href={`mailto:${a.email}`}>{a.email}</a></li>}
        </ul>
      </div>
    </article>
  );
}
