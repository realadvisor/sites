import { legalPath, privacyPath, t } from '@realadvisor/sites-kit/i18n';
import { NAV, CONTACT, BROCHURE, tel } from '../lib/nav';
import type { Shell } from '../root';
import './Footer.css';

export function Footer({ s }: { s: Shell }) {
  return (
    <footer className="site-footer">
      <div className="wrap top">
        <div className="brand">
          <p className="name">{s.title}</p>
          {s.devPlace.length > 0 && <p className="addr">{s.devPlace.join(', ')}</p>}
          <a className="button light" href={BROCHURE} download>Brochure (PDF)</a>
        </div>
        <div className="col">
          <h2>Commercialisation</h2>
          <p>{s.orgName}</p>
          {s.office.map((l, i) => <p key={i}>{l}</p>)}
          {s.phone && <p><a href={tel(s.phone)}>{s.phone}</a></p>}
          {s.email && <p><a href={`mailto:${s.email}`}>{s.email}</a></p>}
        </div>
        <nav className="col" aria-label="Pied de page">
          <h2>Le projet</h2>
          <ul>
            <li><a href="/">Accueil</a></li>
            {[...NAV, CONTACT].map((n) => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}
          </ul>
        </nav>
        {s.credits.length > 0 && (
          <div className="col">
            <h2>Intervenants</h2>
            <dl>
              {s.credits.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </div>
        )}
      </div>
      <div className="wrap bottom">
        <p>© {new Date().getFullYear()} {s.orgName}. Visuels et plans non contractuels.</p>
        <p className="legal"><a href={legalPath()}>{t('legalNotice')}</a><a href={privacyPath()}>{t('privacyPolicy')}</a></p>
      </div>
    </footer>
  );
}
