import type { Team } from '@realadvisor/sites-sdk/types';
import { t, legalPath, privacyPath } from '@realadvisor/sites-kit-core/i18n';
import type { ProgrammeLink } from '../root';
import { addressLine, programmeStatus, programmeUrl, telHref, PROGRAMMES_PATH } from '../lib/fr';
import { Wordmark } from './Wordmark';
import './Footer.css';

type Props = { name: string; legalName: string; team?: Team; programmes: ProgrammeLink[] };

export function Footer({ name, legalName, team, programmes }: Props) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap sf-top">
        <div className="sf-brand">
          <Wordmark name={name} />
          <p className="sf-tagline">Promoteur immobilier{team?.address?.city ? `, bureau à ${team.address.city}` : ''}.</p>
        </div>
        <div className="sf-cols">
          <div>
            <h2 className="sf-fh">Programmes</h2>
            <ul>
              {programmes.map((d) => (
                <li key={d.id}><a href={programmeUrl(d)}>{d.title}</a><span className="muted"> · {d.address.city}{programmeStatus(d) && ` · ${programmeStatus(d)}`}</span></li>
              ))}
              <li><a href={PROGRAMMES_PATH}>Tous nos programmes</a></li>
            </ul>
          </div>
          {team && (
            <div>
              <h2 className="sf-fh">Nous écrire, nous appeler</h2>
              <address>
                {addressLine(team.address) && <p>{addressLine(team.address)}</p>}
                {team.phone && <p><a href={telHref(team.phone)} className="num">{team.phone}</a></p>}
                {team.email && <p><a href={`mailto:${team.email}`}>{team.email}</a></p>}
              </address>
            </div>
          )}
          <div>
            <h2 className="sf-fh">Informations</h2>
            <ul>
              <li><a href="/a-propos">À propos</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href={legalPath()}>{t('legalNotice')}</a></li>
              <li><a href={privacyPath()}>{t('privacyPolicy')}</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="wrap sf-bottom">
        <p>© {year} {legalName}</p>
        <p>Visuels et plans non contractuels.</p>
      </div>
    </footer>
  );
}
