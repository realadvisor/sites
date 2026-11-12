/** Contact: enquiry form and every office with address, phone, e-mail and a map link. */
import type { Route } from './+types/contact';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { Site } from '../components/Site';
import { PageBand } from '../components/PageBand';
import { siteData } from '../lib/data.server';
import { href, langOfPath, LOCALE, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './contact.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const { org, teams, primary } = await siteData();
  const url = new URL(href('home', l), siteUrl()).href;
  return {
    l, orgName: org.name,
    teams: teams.map((x) => ({ id: x.id, name: x.name, address: x.address, phone: x.phone, email: x.email, slug: teamSlug(x, teams) })),
    jsonLd: agencyJsonLd({ id: org.id, name: org.name, phone: primary?.phone, email: primary?.email, address: org.address }, url),
  };
}

export default function Contact({ loaderData: { l, orgName, teams, jsonLd } }: Route.ComponentProps) {
  const t = tx(l);
  return (
    <Site l={l} route="contact" title={`${t('contactTitle')} | ${orgName}`} description={t('contactLede')} jsonLd={jsonLd}>
      <PageBand l={l} title={t('contactTitle')} lede={t('contactLede')} crumbs={[{ label: t('navContact') }]} />
      <section className="section">
        <div className="wrap cols">
          <div className="form">
            <h2 className="h3">{t('writeUs')}</h2>
            <EnquiryForm locale={LOCALE[l]} contactReason="other" />
          </div>
          <ul className="plain-list offices" aria-label={t('navOffices')}>
            {teams.map((x) => {
              const osm = x.address.lat != null ? `https://www.openstreetmap.org/?mlat=${x.address.lat}&mlon=${x.address.lng}#map=17/${x.address.lat}/${x.address.lng}` : undefined;
              return (
                <li key={x.id}>
                  <h2 className="h3"><a href={href('offices', l, x.slug)}>{t('officeOf', { city: cityName(x.address.city, l) || x.name })}</a></h2>
                  <address>
                    {x.address.street && <span>{x.address.street}</span>}
                    {(x.address.postcode || x.address.city) && <span>{[x.address.postcode, cityName(x.address.city, l)].filter(Boolean).join(' ')}</span>}
                  </address>
                  <ul className="plain-list links">
                    {x.phone && <li><a className="num" href={tel(x.phone)}>{x.phone}</a></li>}
                    {x.email && <li><a href={`mailto:${x.email}`}>{x.email}</a></li>}
                    {osm && <li><a href={osm} rel="noopener">{t('directions')} ↗</a></li>}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </Site>
  );
}
