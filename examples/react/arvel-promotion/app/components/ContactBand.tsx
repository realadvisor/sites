/** Closing band: where the office is, the phone, the e-mail and the contact page. */
import type { Team } from '@realadvisor/sites-sdk/types';
import { addressLine, telHref } from '../lib/fr';
import './ContactBand.css';

export function ContactBand({ team, title }: { team?: Team; title?: string }) {
  const city = team?.address?.city;
  const heading = title ?? (city ? `Pour une visite ou la grille des prix, appelez-nous ou passez au bureau d’${city}.` : 'Pour une visite ou la grille des prix, appelez-nous.');
  const address = team ? addressLine(team.address) : '';
  return (
    <section className="cband" aria-labelledby="h-band">
      <div className="wrap cb-grid">
        <h2 id="h-band" className="cb-h">{heading}</h2>
        <dl className="cb-actions">
          {team?.phone && <div><dt>Téléphone</dt><dd><a href={telHref(team.phone)} className="num">{team.phone}</a></dd></div>}
          {team?.email && <div><dt>E-mail</dt><dd><a href={`mailto:${team.email}`}>{team.email}</a></dd></div>}
          {address && <div><dt>Bureau</dt><dd>{address}</dd></div>}
          <div><dt>Formulaire</dt><dd><a href="/contact">Écrire à nos conseillers</a></dd></div>
        </dl>
      </div>
    </section>
  );
}
