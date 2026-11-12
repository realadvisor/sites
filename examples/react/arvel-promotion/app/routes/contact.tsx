// Contact: the developer's office, the advisers per programme and the
// general enquiry form (kit EnquiryForm, contactReason other).
import { Fragment } from 'react';
import type { Route } from './+types/contact';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { AgentPhoto } from '../components/AgentPhoto';
import { primaryTeam, programmes as allProgrammes, sites } from '../lib/data.server';
import { addressLine, languageList, programmeUrl, telHref } from '../lib/fr';
import { organisationJsonLd } from '../lib/seo';
import './contact.css';

export async function loader() {
  const [org, team, programmes, agents] = await Promise.all([sites.organisation(), primaryTeam(), allProgrammes(), sites.agents()]);
  return {
    name: team?.name ?? org.name,
    team,
    advisers: agents.map((a) => ({ agent: a, programmes: programmes.filter((d) => d.agents.some((x) => x.id === a.id)).map((d) => ({ slug: d.slug, title: d.title })) })),
    jsonLd: organisationJsonLd(org, team, siteUrl()),
  };
}

export default function Contact({ loaderData: { name, team, advisers, jsonLd } }: Route.ComponentProps) {
  const address = team ? addressLine(team.address) : '';
  return (
    <Layout title={`Contact | ${name}`} description={`Contacter ${name}${address ? `, ${address}` : ''} : téléphone, e-mail et formulaire.`} jsonLd={jsonLd} current="contact">
      <PageHead title="Nous écrire ou nous rencontrer" />
      <section className="section section--tight">
        <div className="wrap ct-grid">
          <div className="ct-side">
            {team && (
              <div className="ct-office">
                <h2 className="h3">{name}</h2>
                <address>
                  {address && <p>{address}</p>}
                  {team.phone && <p><a className="ct-big num" href={telHref(team.phone)}>{team.phone}</a></p>}
                  {team.email && <p><a href={`mailto:${team.email}`}>{team.email}</a></p>}
                </address>
              </div>
            )}
            {advisers.length > 0 && (
              <div className="ct-advisers">
                <h2 className="h3 ct-adv-h">Vos conseillers</h2>
                <ul>
                  {advisers.map(({ agent: a, programmes: ps }) => (
                    <li key={a.id}>
                      <AgentPhoto agent={a} />
                      <div>
                        <p className="ct-an">{a.first_name} {a.last_name}</p>
                        {ps.length > 0 && <p className="ct-ap">Ventes, {ps.map((d, i) => <Fragment key={d.slug}>{i > 0 && ', '}<a href={programmeUrl(d)}>{d.title}</a></Fragment>)}</p>}
                        {a.languages?.length ? <p className="ct-ap">{languageList(a.languages)}</p> : null}
                        <p className="ct-ac">
                          {a.phone && <a href={telHref(a.phone)} className="num">{a.phone}</a>}
                          {a.email && <a href={`mailto:${a.email}`}>{a.email}</a>}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="paper ct-card" id="message">
            <h2 className="h3 ct-fh">Votre message</h2>
            <p className="ct-fl">Une question sur un programme précis ? Écrivez depuis sa page : votre demande arrive directement à son conseiller.</p>
            <EnquiryForm contactReason="other" submitLabel="Envoyer mon message" />
          </div>
        </div>
      </section>
    </Layout>
  );
}
