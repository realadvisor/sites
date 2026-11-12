/**
 * The sales team in plain type: name, role, languages, phone, e-mail. A 4:5
 * portrait through the image helper when the agent has a photo; no initials.
 */
import type { Agent } from '@realadvisor/sites-sdk/types';
import { tel } from '../lib/docs';
import { tr, type Lang } from '../lib/i18n';
import { Photo } from './Photo';
import './People.css';

export type Person = Pick<Agent, 'id' | 'first_name' | 'last_name' | 'title' | 'languages' | 'phone' | 'email' | 'photo'>;

/** Only the fields People renders (loader side). */
export const person = (a: Agent): Person => ({ id: a.id, first_name: a.first_name, last_name: a.last_name, title: a.title, languages: a.languages, phone: a.phone, email: a.email, photo: a.photo });

export function People({ people, lang, className }: { people: Person[]; lang: Lang; className?: string }) {
  const t = tr(lang);
  const langs = (codes?: string[] | null) => (codes ?? []).map((c) => t.langNames[c] ?? c).join(', ');
  return (
    <ul className={['people', className].filter(Boolean).join(' ')}>
      {people.map((a) => (
        <li key={a.id} className={a.photo ? 'has-photo' : undefined}>
          {a.photo && <Photo src={a.photo.url} alt={a.photo.alt || `${a.first_name} ${a.last_name}`} width={400} height={500} sizes="120px" className="portrait" />}
          <div>
            <p className="nm">{a.first_name} {a.last_name}</p>
            {a.title && <p className="role">{a.title}</p>}
            {a.languages?.length ? <p className="role">{t.languages}: {langs(a.languages)}</p> : null}
            <p className="ct">
              {a.phone && <a href={tel(a.phone)}>{a.phone}</a>}
              {a.email && <a href={`mailto:${a.email}`}>{a.email}</a>}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
