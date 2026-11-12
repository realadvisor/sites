/** Contatti / Contact: the office on a street photo, phone, e-mail, the form. */
import type { Route } from './+types/contact';
import { agencyOf } from '@realadvisor/sites-kit-core/agency';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit-core/image';
import { agencyJsonLd } from '@realadvisor/sites-kit-core/seo';
import { Site } from '../components/Site';
import { AgentBlock } from '../components/AgentBlock';
import { Photo } from '../components/Photo';
import { agency, sites } from '../lib/data.server';
import { brandName } from '../lib/data';
import { placePhoto } from '../lib/places';
import { LOCALE_OF, UI, alternates, langOfPath } from '../lib/i18n';
import { telHref } from '../lib/format';
import './contact.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, agents] = await Promise.all([agency(), sites.agents()]);
  const team = ag.team;
  const addr = team?.address ?? ag.org.address;
  return {
    lang,
    brand: brandName(ag),
    agents,
    phone: team?.phone,
    email: team?.email,
    addr,
    photo: placePhoto('milano', lang, 3),
    osm: addr?.lat != null && addr?.lng != null
      ? `https://www.openstreetmap.org/?mlat=${addr.lat}&mlon=${addr.lng}#map=17/${addr.lat}/${addr.lng}`
      : undefined,
    jsonLd: agencyJsonLd(agencyOf(ag.org, ag.team), new URL('/', siteUrl()).href),
  };
}

export default function Contact({ loaderData: { lang, brand, agents, phone, email, addr, photo, osm, jsonLd } }: Route.ComponentProps) {
  const ui = UI[lang];
  return (
    <Site lang={lang} current="contact" title={`${ui.contactH1} | ${brand}`} description={ui.contactLead}
      image={photo && img(photo.url, { w: 1200, h: 630 })} alternates={alternates('contact')} jsonLd={jsonLd}>
      <header className="wrap phead">
        <h1 className="d-xl">{ui.contactH1}</h1>
        <p className="lead">{ui.contactLead}</p>
      </header>

      <section className="wrap office" aria-label={ui.footerOffice}>
        {photo && (
          <div className="frame office-photo">
            <Photo src={photo} alt={photo.alt} width={1000} height={1200} priority sizes="(min-width: 900px) 46vw, 100vw" mobile={{ width: 800, height: 700 }} />
          </div>
        )}
        <dl className="office-facts">
          {addr && (
            <div>
              <dt className="label muted">{ui.address}</dt>
              <dd className="d-m">{addr.street}<br />{[addr.postcode, addr.city].filter(Boolean).join(' ')}</dd>
              {osm && <dd><a className="arrow-link" href={osm} rel="noopener">{ui.openMap} <span aria-hidden="true">↗</span></a></dd>}
            </div>
          )}
          {phone && (
            <div>
              <dt className="label muted">{ui.phone}</dt>
              <dd className="d-m"><a className="num" href={telHref(phone)}>{phone}</a></dd>
            </div>
          )}
          {email && (
            <div>
              <dt className="label muted">{ui.email}</dt>
              <dd className="office-mail"><a href={`mailto:${email}`}>{email}</a></dd>
            </div>
          )}
          <div><dd className="muted">{ui.byAppointment}</dd></div>
        </dl>
      </section>

      {agents.length > 0 && (
        <section className="wrap people" aria-labelledby="people-h">
          <h2 id="people-h" className="d-l">{ui.teamH1}</h2>
          <ul className="people-list">
            {agents.map((a) => <li key={a.id}><AgentBlock agent={a} lang={lang} /></li>)}
          </ul>
        </section>
      )}

      <section className="form" aria-labelledby="form-h">
        <div className="wrap form-in">
          <h2 id="form-h" className="d-l">{ui.writeUs}</h2>
          <EnquiryForm contactReason="other" locale={LOCALE_OF[lang]} />
        </div>
      </section>
    </Site>
  );
}
