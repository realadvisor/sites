// Contact / register interest: the enquiry form with the unit select
// (?lot=<id> preselects one), the broker, the sales office and the map.
import type { Route } from './+types/contact';
import { img } from '@realadvisor/sites-kit/image';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { Layout } from '../components/Layout';
import { AgentContact } from '../components/AgentContact';
import { StaticMap } from '../components/StaticMap';
import { legalAgency, loadSite } from '../lib/data.server';
import { unitLabel, unitNumber, unitOptions } from '../lib/units';
import { BROCHURE, tel } from '../lib/nav';
import './contact.css';

export async function loader({ request }: Route.LoaderArgs) {
  const site = await loadSite();
  const q = new URL(request.url).searchParams;
  const lot = q.get('lot');
  const chosen = site.dev.units.find((u) => u.id === lot && u.status !== 'sold');
  return { site, chosen, brochure: q.get('demande') === 'brochure', jsonLd: agencyJsonLd(legalAgency(site), new URL('/', siteUrl()).href) };
}

export default function Contact({ loaderData }: Route.ComponentProps) {
  const { site, chosen, brochure, jsonLd } = loaderData;
  const { dev, org, team, agents, extras } = site;
  const brokers = [...dev.agents, ...agents.filter((a) => !dev.agents.some((d) => d.id === a.id))];
  const office = [org.address?.street, [org.address?.postcode, org.address?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const name = dev.title.replace(/^Les /, '');
  const message = chosen
    ? `Bonjour, je suis intéressé(e) par le ${[unitNumber(chosen, extras), unitLabel(chosen)].filter(Boolean).join(', ')} aux ${name}. Merci de me recontacter.`
    : brochure
      ? `Bonjour, je souhaite recevoir la brochure, les plans et la liste de prix des ${name}.`
      : `Bonjour, je souhaite en savoir plus sur les ${name} et visiter l’espace de vente.`;
  return (
    <Layout
      bar={false}
      title={`Contact et espace de vente | ${dev.title}`}
      description={`Demandez la brochure, un plan ou un rendez-vous à l’espace de vente des ${name}, ${dev.address.city}. Commercialisation : ${org.name}.`}
      image={dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 })}
      jsonLd={jsonLd}
    >
      <div className="wrap grid contact-grid">
        <div className="left">
          <h1>Contact</h1>
          <p className="lede">Demandez un plan, la liste de prix ou un rendez-vous à l’espace de vente de {org.address?.city ?? dev.address.city}. Indiquez le lot qui vous intéresse si vous l’avez choisi.</p>

          <ul className="people">
            {brokers.map((a) => (
              <li key={a.id}><AgentContact agent={a} org={org.name} /></li>
            ))}
          </ul>

          <dl className="office">
            <div><dt>Commercialisation</dt><dd>{org.name}{office && <><br />{office}</>}</dd></div>
            {team?.phone && <div><dt>Téléphone</dt><dd><a href={tel(team.phone)}>{team.phone}</a></dd></div>}
            {team?.email && <div><dt>E-mail</dt><dd><a href={`mailto:${team.email}`}>{team.email}</a></dd></div>}
            <div><dt>Brochure</dt><dd><a href={BROCHURE} download>Télécharger (PDF)</a></dd></div>
          </dl>
        </div>

        <div className="right">
          <div className="panel">
            <h2>Votre demande</h2>
            <EnquiryForm id="contact" developmentId={dev.id} units={unitOptions(dev.units, extras)} selectedUnit={chosen?.id} agentName={site.agent?.first_name} message={message} />
          </div>
        </div>
      </div>

      {org.address?.lat != null && org.address?.lng != null && (
        <section className="wrap map-sec" aria-labelledby="m-h">
          <h2 id="m-h">Espace de vente</h2>
          <StaticMap lat={org.address.lat} lng={org.address.lng} zoom={15} label={[org.name, office].filter(Boolean).join(', ')} />
        </section>
      )}
    </Layout>
  );
}
