import { legalPath, privacyPath, t } from '@realadvisor/sites-kit/i18n';
import type { LayoutData } from '../lib/data.server';
import { Wordmark } from './Wordmark';
import { Icon } from './Icon';
import './Footer.css';

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;

export function Footer({ site }: { site: LayoutData }) {
  const team = site.team;
  const addr = site.devAddress;
  const office = team?.address ?? site.orgAddress;
  return (
    <footer className="site-footer on-ink">
      <div className="wrap top">
        <div className="intro">
          <Wordmark tone="light" />
          <p className="claim">{site.units} Mietwohnungen in drei Häusern{addr.city ? `, ${addr.city}` : ''}.</p>
          <a className="cta cta--zinnober" href="/kontakt">Interesse anmelden <Icon name="arrow" /></a>
        </div>
        <div className="cols">
          <div>
            <h2 className="eyebrow">Quartier</h2>
            <ul>
              <li><a href="/wohnungen">Wohnungen</a></li>
              <li><a href="/lage">Lage</a></li>
              <li><a href="/galerie">Galerie</a></li>
              <li><a href="/news">Baustelle</a></li>
              <li><a href="/dokumente">Dokumente</a></li>
            </ul>
          </div>
          <div>
            <h2 className="eyebrow">Erstvermietung</h2>
            <address>
              <span>{team?.name ?? site.orgName}</span>
              {office?.street && <span>{office.street}</span>}
              {(office?.postcode || office?.city) && <span>{[office?.postcode, office?.city].filter(Boolean).join(' ')}</span>}
            </address>
            <ul>
              {team?.phone && <li><a href={tel(team.phone)}><span className="num">{team.phone}</span></a></li>}
              {team?.email && <li><a className="mail" href={`mailto:${team.email}`}>{team.email.split('@')[0]}<wbr />@{team.email.split('@')[1]}</a></li>}
            </ul>
          </div>
          <div>
            <h2 className="eyebrow">Adresse Quartier</h2>
            <address>
              {addr.street && <span>{addr.street}</span>}
              {(addr.postcode || addr.city) && <span>{[addr.postcode, addr.city].filter(Boolean).join(' ')}</span>}
            </address>
          </div>
        </div>
      </div>
      <div className="wrap bottom">
        <p>Eine Vermietung der {site.orgName}</p>
        <ul>
          <li><a href="/kontakt">Kontakt</a></li>
          <li><a href={legalPath()}>{t('legalNotice')}</a></li>
          <li><a href={privacyPath()}>{t('privacyPolicy')}</a></li>
        </ul>
      </div>
    </footer>
  );
}
