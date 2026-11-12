import type { Route } from './+types/contact';
import { agencyOf } from '@realadvisor/sites-kit-core/agency';
import { agencyJsonLd } from '@realadvisor/sites-kit-core/seo';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { canonical } from '@realadvisor/sites-kit-react/server/kit';
import { Site } from '../components/Site';
import { Photo } from '../components/Photo';
import { PHOTOS, photoOg } from '../lib/photos';
import { agency, brandName, sites } from '../lib/data.server';
import { LOCALE_OF, UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import { languageList, telHref } from '../lib/format';
import './contact.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, agents] = await Promise.all([agency(), sites.agents()]);
  const { team, org } = ag;
  return {
    lang,
    name: brandName(ag),
    phone: team?.phone,
    email: team?.email,
    addr: team?.address ?? org.address,
    langs: languageList([...new Set(agents.flatMap((a) => a.languages ?? []))], lang),
    jsonLd: agencyJsonLd(agencyOf(ag.org, ag.team), canonical(new URL(href('home', lang), request.url))),
  };
}

export default function Contact({ loaderData: { lang, name, phone, email, addr, langs, jsonLd } }: Route.ComponentProps) {
  const ui = UI[lang];
  const osm = addr?.lat != null && addr?.lng != null ? `https://www.openstreetmap.org/?mlat=${addr.lat}&mlon=${addr.lng}#map=16/${addr.lat}/${addr.lng}` : undefined;
  const photo = PHOTOS.contact;
  const lead = langs ? fill(ui.contactLead, { langs }) : '';
  return (
    <Site lang={lang} current="contact" title={`${ui.contactH1} | ${name}`} description={lead || `${ui.contactH1} ${name}`}
      image={photoOg(photo)} alternates={alternates('contact')} jsonLd={jsonLd}>
      <header className="phead wrap">
        <h1 className="display-xl">{ui.contactH1}</h1>
        {lead && <p className="lead">{lead}</p>}
      </header>

      <section className="talk">
        <div className="wrap talk-in">
          <h2 className="visually-hidden">{ui.contactH1}</h2>
          {phone && <a href={telHref(phone)}><span className="talk-k">{ui.phoneL}</span><span className="talk-v num">{phone}</span></a>}
          {email && <a href={`mailto:${email}`}><span className="talk-k">{ui.emailL}</span><span className="talk-v">{email}</span></a>}
          <a href="#enquiry"><span className="talk-k">{ui.writeUs}</span><span className="talk-v">{ui.bookVisit}</span></a>
        </div>
      </section>

      <section className="office wrap" aria-labelledby="office-h">
        <div className="office-photo">
          <Photo photo={photo} lang={lang} decorative sizes="(min-width: 900px) 55vw, 100vw" priority />
        </div>
        <div className="office-text">
          <h2 id="office-h" className="display-m">{fill(ui.officeIn, { town: addr?.city ?? name })}</h2>
          {addr && <address>{addr.street && <>{addr.street}<br /></>}{[addr.postcode, addr.city].filter(Boolean).join(' ')}</address>}
          {osm && <a className="link" href={osm} target="_blank" rel="noopener">{ui.openMap} <span aria-hidden="true">↗</span></a>}
        </div>
      </section>

      <section className="ask">
        <div className="wrap ask-in">
          <div><h2 className="display-m">{ui.writeUs}</h2></div>
          <EnquiryForm contactReason="other" locale={LOCALE_OF[lang]} />
        </div>
      </section>
    </Site>
  );
}
