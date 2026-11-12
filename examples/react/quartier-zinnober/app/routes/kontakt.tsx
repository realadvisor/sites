// Kontakt / Interesse anmelden: the enquiry form with the unit select
// (?wohnung=<id> preselects one), the rental office and the contact person.
import type { Route } from './+types/kontakt';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { AgentPhoto } from '../components/AgentPhoto';
import { Icon } from '../components/Icon';
import { LANG } from '../components/ContactCard';
import { rowsOf, site as load } from '../lib/data.server';
import { unitOptions, unitTitle } from '../lib/units';
import './kontakt.css';

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;

export async function loader({ request }: Route.LoaderArgs) {
  const site = await load();
  const { dev, team, org } = site;
  const rows = rowsOf(dev);
  const wanted = new URL(request.url).searchParams.get('wohnung');
  const chosen = rows.find((r) => r.u.id === wanted && r.u.status !== 'sold');
  const office = team?.address ?? org.address;
  return {
    meta: {
      title: `Interesse anmelden und Kontakt | ${dev.title}, ${dev.address.city ?? ''}`,
      description: `Interesse an einer Wohnung im ${dev.title} anmelden: Bewerbungsunterlagen, Besichtigung der Musterwohnung, Kontakt zur Erstvermietung.`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: team?.name ?? org.name,
        telephone: team?.phone,
        email: team?.email,
        address: office && { '@type': 'PostalAddress', streetAddress: office.street, postalCode: office.postcode, addressLocality: office.city, addressCountry: 'CH' },
      },
    },
    devId: dev.id,
    options: unitOptions(rows),
    chosenId: chosen?.u.id,
    contact: site.contact,
    team: team && { name: team.name, phone: team.phone, email: team.email },
    orgName: org.name,
    office,
    people: dev.agents.length ? dev.agents : site.agents,
    message: chosen
      ? `Guten Tag, ich interessiere mich für die Wohnung ${chosen.x.number ? `${chosen.x.number} (${unitTitle(chosen)})` : unitTitle(chosen)} im ${dev.title}. Bitte senden Sie mir die Bewerbungsunterlagen.`
      : `Guten Tag, ich interessiere mich für eine Wohnung im ${dev.title}. Bitte senden Sie mir die Bewerbungsunterlagen.`,
  };
}

export default function Kontakt({ loaderData: d }: Route.ComponentProps) {
  const { team, office, people } = d;
  return (
    <Layout page="kontakt" {...d.meta}>
      <PageHead title="Interesse anmelden" lead="Wählen Sie Ihre Wohnung und schreiben Sie uns. Wir senden Ihnen die Bewerbungsunterlagen und einen Termin für die Musterwohnung." tone="zinnober" />

      <section className="wrap contact">
        <div className="form-card" id="anfrage">
          <h2 className="h">Ihre Anfrage</h2>
          <EnquiryForm
            id="kontakt-form"
            developmentId={d.devId}
            units={d.options}
            selectedUnit={d.chosenId}
            agentId={d.contact?.id}
            agentName={d.contact?.first_name}
            message={d.message}
            submitLabel="Anfrage senden"
          />
        </div>

        <aside className="side">
          <div className="block block--ink">
            <h2 className="h">Erstvermietung</h2>
            <address>
              <strong>{team?.name ?? d.orgName}</strong>
              {office?.street && <span>{office.street}</span>}
              {(office?.postcode || office?.city) && <span>{[office?.postcode, office?.city].filter(Boolean).join(' ')}</span>}
            </address>
            <ul className="links">
              {team?.phone && <li><a href={tel(team.phone)}><Icon name="phone" /><span className="num">{team.phone}</span></a></li>}
              {team?.email && <li><a href={`mailto:${team.email}`}><Icon name="mail" /><span>{team.email}</span></a></li>}
            </ul>
          </div>
          {people.length > 0 && (
            <div className="block">
              <h2 className="h">Ihre Ansprechpersonen</h2>
              <ul className="people">
                {people.map((a) => (
                  <li key={a.id}>
                    <AgentPhoto agent={a} size={88} />
                    <div>
                      <p className="nm">{a.first_name} {a.last_name}</p>
                      {a.title && <p className="muted lang">{a.title}</p>}
                      {a.languages && a.languages.length > 0 && <p className="muted lang">Spricht {a.languages.map((l) => LANG[l] ?? l.toUpperCase()).join(', ')}</p>}
                      <ul className="links">
                        {a.phone && <li><a href={tel(a.phone)}><Icon name="phone" size={18} /><span className="num">{a.phone}</span></a></li>}
                        {a.email && <li><a href={`mailto:${a.email}`}><Icon name="mail" size={18} /><span>{a.email}</span></a></li>}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="block block--butter">
            <h2 className="h">So geht es weiter</h2>
            <ol className="steps">
              <li><strong>Anfrage senden.</strong> Mit der gewünschten Wohnung.</li>
              <li><strong>Unterlagen erhalten.</strong> Bewerbungsformular per E-Mail.</li>
              <li><strong>Musterwohnung besichtigen.</strong> Termin nach Vereinbarung.</li>
              <li><strong>Mietvertrag.</strong> Nach Prüfung der Bewerbung.</li>
            </ol>
          </div>
        </aside>
      </section>
    </Layout>
  );
}
