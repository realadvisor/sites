/** Contact: the form, then every office with address, phone, e-mail and a map link. */
import type { Route } from './+types/contact';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { Site } from '../components/Site';
import { PageHead } from '../components/PageHead';
import { siteData } from '../lib/data.server';
import { href, langOfPath, LOCALE, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './contact.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const { org, teams, primary } = await siteData();
  return {
    l,
    orgName: org.name,
    jsonLd: agencyJsonLd({ id: org.id, name: org.name, phone: primary?.phone, email: primary?.email, address: org.address }, new URL('/', siteUrl()).href),
    teams: teams.map((x) => ({ id: x.id, slug: teamSlug(x, teams), name: x.name, address: x.address, phone: x.phone, email: x.email })),
  };
}

export default function Contact({ loaderData: { l, orgName, jsonLd, teams } }: Route.ComponentProps) {
  const t = tx(l);
  const C = {
    en: { title: 'Contact', lede: 'Write to us and the office of the area you are interested in will answer. Or call an office directly.', form: 'Send a message', map: 'Map' },
    fr: { title: 'Contact', lede: 'Écrivez-nous : le bureau du secteur qui vous intéresse vous répondra. Ou appelez directement un bureau.', form: 'Envoyer un message', map: 'Plan' },
  }[l];
  return (
    <Site l={l} route="contact" title={`${C.title} | ${orgName}`} description={C.lede} jsonLd={jsonLd}>
      <PageHead crumbLabel={t('breadcrumb')} crumbs={[{ label: t('home'), href: href('home', l) }, { label: t('navContact') }]} title={C.title} lede={C.lede} />
      <section className="wrap grid">
        <div className="form">
          <h2 className="h3">{C.form}</h2>
          <EnquiryForm contactReason="other" locale={LOCALE[l]} />
        </div>
        <ul className="plain offices">
          {teams.map((x) => (
            <li key={x.id}>
              <h2 className="h3"><a href={href('offices', l, x.slug)}>{cityName(x.address.city, l) || x.name}</a></h2>
              <address>
                {x.address.street && <span>{x.address.street}</span>}
                <span>{[x.address.postcode, x.address.city].filter(Boolean).join(' ')}</span>
              </address>
              <ul className="plain c">
                {x.phone && <li><a className="num" href={tel(x.phone)}>{x.phone}</a></li>}
                {x.email && <li><a href={`mailto:${x.email}`}>{x.email}</a></li>}
                {x.address.lat != null && x.address.lng != null && <li><a href={`https://www.openstreetmap.org/?mlat=${x.address.lat}&mlon=${x.address.lng}#map=17/${x.address.lat}/${x.address.lng}`} rel="noopener">{C.map} ↗</a></li>}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </Site>
  );
}
