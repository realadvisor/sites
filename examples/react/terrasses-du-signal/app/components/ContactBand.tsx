/** Closing band on every page: the broker in plain type, the sales office, one action. */
import { AgentContact } from './AgentContact';
import { tel } from '../lib/nav';
import type { Site } from '../lib/data.server';
import './ContactBand.css';

export function ContactBand({ site, heading }: { site: Pick<Site, 'agent' | 'team' | 'org'>; heading?: string }) {
  const { agent, team, org } = site;
  const city = org.address?.city;
  const h = heading ?? (city ? `Rendez-vous à l’espace de vente, ${city}` : 'Rendez-vous à l’espace de vente');
  const office = [org.address?.street, [org.address?.postcode, org.address?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return (
    <section className="band" aria-labelledby="band-h">
      <div className="wrap inner">
        <div className="lead">
          <h2 id="band-h">{h}</h2>
          {office && <p className="addr">{org.name}, {office}</p>}
          <a className="button" href="/contact">Prendre rendez-vous</a>
        </div>
        {agent ? <AgentContact agent={agent} org={org.name} /> : (
          <p className="links">
            {team?.phone && <a href={tel(team.phone)}>{team.phone}</a>}
            {team?.email && <a href={`mailto:${team.email}`}>{team.email}</a>}
          </p>
        )}
      </div>
    </section>
  );
}
