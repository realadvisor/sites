/**
 * Contact / register interest: the development enquiry form (developmentId +
 * the required unit select), prefilled from ?u= (shortlist) or ?lot=, the
 * sales office and the team's agents.
 */
import type { Route } from './+types/contact';
import { img } from '@realadvisor/sites-kit/image';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { Layout } from '../components/Layout';
import { AgentCard } from '../components/AgentCard';
import { loadSite } from '../lib/data.server';
import { langOf, LOCALE, tel } from '../lib/routes';
import { unitLabel, unitNumber, unitOptions, unitsFromIds } from '../lib/units';
import './contact.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams;
  const site = await loadSite(request);
  const ids = unitsFromIds(site.dev, q.get('u') ?? q.get('lot')).filter((u) => u.status !== 'sold').map((u) => u.id);
  return { l: langOf(url.pathname), site, ids };
}

export default function Contact({ loaderData: { l, site, ids } }: Route.ComponentProps) {
  const { dev, team, org, agents } = site;
  const picked = ids.map((id) => dev.units.find((u) => u.id === id)!);
  const name = (u: (typeof picked)[number]) => (unitNumber(u) ? `${unitNumber(u)} (${unitLabel(u, l, dev.units)})` : unitLabel(u, l, dev.units));
  const T = {
    it: {
      title: `Contatti e richieste | ${dev.title}`,
      h1: 'Contatti',
      intro: 'Per il listino, la descrizione tecnica o una visita del cantiere scrivici o chiamaci. Rispondiamo entro un giorno lavorativo.',
      formH: 'La tua richiesta',
      office: 'Ufficio vendite',
      people: 'Le persone che vi seguono',
      msg: picked.length
        ? `Buongiorno, vorrei ricevere informazioni ${picked.length === 1 ? 'sull’appartamento' : 'sugli appartamenti'} ${picked.map(name).join(', ')}.`
        : undefined,
    },
    de: {
      title: `Kontakt und Anfragen | ${dev.title}`,
      h1: 'Kontakt',
      intro: 'Für Preisliste, Baubeschrieb oder eine Besichtigung der Baustelle schreiben oder rufen Sie uns an. Wir antworten innert eines Arbeitstags.',
      formH: 'Ihre Anfrage',
      office: 'Verkaufsbüro',
      people: 'Ihre Ansprechpersonen',
      msg: picked.length
        ? `Guten Tag, ich interessiere mich für ${picked.length === 1 ? 'die Wohnung' : 'die Wohnungen'} ${picked.map(name).join(', ')}.`
        : undefined,
    },
  }[l];
  // The development's broker first, then the rest of the team.
  const people = [...(site.agent ? [site.agent] : []), ...agents.filter((a) => a.id !== site.agent?.id && (!team || a.team_ids.includes(team.id)))];
  const office = team?.address ?? org.address;
  const cover = dev.photos[0];
  return (
    <Layout l={l} route="contact" scope="v-contact" title={T.title} description={T.intro} image={cover ? img(cover.url, { w: 1200, h: 630 }) : undefined} bar={false}>
      <div className="wrap grid">
        <div className="intro">
          <h1 className="h1">{T.h1}</h1>
          <p className="lede">{T.intro}</p>
        </div>
        <div className="info">
          <div className="office">
            <h2 className="h3">{T.office}</h2>
            <p>{team?.name ?? org.name}</p>
            {office && <p className="muted">{office.street}, {office.postcode} {office.city}</p>}
            {team?.phone && <p><a className="big num" href={tel(team.phone)}>{team.phone}</a></p>}
            {team?.email && <p><a href={`mailto:${team.email}`}>{team.email}</a></p>}
          </div>
          {people.length > 0 && (
            <div className="people">
              <h2 className="h3">{T.people}</h2>
              {people.map((a) => <AgentCard key={a.id} agent={a} l={l} />)}
            </div>
          )}
        </div>
        <section className="form" id="richiesta" aria-labelledby="form-h">
          <h2 id="form-h" className="h3">{T.formH}</h2>
          <EnquiryForm
            developmentId={dev.id}
            units={unitOptions(dev.units, l)}
            selectedUnit={picked[0]?.id}
            message={T.msg}
            agentId={site.agent?.id}
            agentName={site.agent?.first_name}
            locale={LOCALE[l]}
          />
        </section>
      </div>
    </Layout>
  );
}
