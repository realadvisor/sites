/** Contact: the general enquiry form and the four agencies with address, phone and e-mail. */
import type { Route } from './+types/contact';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { agency, siteData } from '../lib/data.server';
import { joinFr, teamHref, teamShortName, tel } from '../lib/site';
import './contact.css';

export async function loader() {
  const [{ org, teams }, ag] = await Promise.all([siteData(), agency()]);
  return { brand: org.name.replace(/\s+SAS$/, ''), teams, jsonLd: agencyJsonLd(ag, new URL(siteUrl()).origin) };
}

export default function Page({ loaderData: { brand, teams, jsonLd } }: Route.ComponentProps) {
  const cities = [...new Set(teams.map((t) => t.address.city).filter(Boolean))] as string[];
  return (
    <Layout title={`Contact | ${brand}`} description={`Contactez ${brand} à ${joinFr(cities)} : formulaire, téléphones et adresses des ${teams.length} agences.`} jsonLd={jsonLd}>
      <PageHead title="Contact" lede="Une question sur une annonce, une visite ou une estimation ? Écrivez-nous, l'agence concernée vous répond." />
      <div className="wrap contact">
        <div className="contact__form">
          <EnquiryForm id="contact-form" contactReason="other" />
        </div>
        <ul className="offices">
          {teams.map((t) => (
            <li key={t.id} className="office">
              <h2 className="office__name"><a href={teamHref(t)}>{teamShortName(t)}</a></h2>
              <address>
                {t.address.street && <span>{t.address.street}</span>}
                <span>{[t.address.postcode, t.address.city].filter(Boolean).join(' ')}</span>
              </address>
              {t.phone && <a className="num" href={tel(t.phone)}>{t.phone}</a>}
              {t.email && <a href={`mailto:${t.email}`}>{t.email}</a>}
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
