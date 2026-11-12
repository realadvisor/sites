/** Contact: enquiry form and every office with address, phone, email and map link. */
import type { Route } from './+types/contact';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { useKit } from '@realadvisor/sites-kit-react/components/Document';
import { agencyJsonLd } from '@realadvisor/sites-kit-core/seo';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { siteData } from '../lib/data.server';
import { href, langOf, LOCALE, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { tel } from '../lib/format';
import './contact.css';

export async function loader({ request }: Route.LoaderArgs) {
  const { org, teams, primary } = await siteData();
  return { l: langOf(new URL(request.url).pathname), org: { id: org.id, name: org.name, address: org.address }, teams, primary: primary && { phone: primary.phone, email: primary.email } };
}

export default function Page({ loaderData: { l, org, teams, primary } }: Route.ComponentProps) {
  const t = tx(l);
  const siteUrl = new URL(href('home', l), useKit().siteUrl).href;
  return (
    <Layout l={l} route="contact" title={`${t('contactTitle')} | ${org.name}`} description={t('contactLede')}
      jsonLd={agencyJsonLd({ id: org.id, name: org.name, phone: primary?.phone, email: primary?.email, address: org.address }, siteUrl)}>
      <section className="band on-navy">
        <div className="wrap band__inner">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navContact') }]} />
          <h1 className="h1">{t('contactTitle')}</h1>
          <p className="lede">{t('contactLede')}</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap cols">
          <div className="form">
            <h2 className="h2">{t('writeUs')}</h2>
            <EnquiryForm locale={LOCALE[l]} contactReason="other" />
          </div>
          <ul className="plain-list offices" aria-label={t('navOffices')}>
            {teams.map((x) => {
              const osm = x.address.lat != null ? `https://www.openstreetmap.org/?mlat=${x.address.lat}&mlon=${x.address.lng}#map=17/${x.address.lat}/${x.address.lng}` : undefined;
              return (
                <li key={x.id}>
                  <h2 className="h3"><a href={href('offices', l, teamSlug(x, teams))}>{t('officeOf', { city: cityName(x.address.city, l) || x.name })}</a></h2>
                  <address>
                    {x.address.street && <span>{x.address.street}</span>}
                    <span>{[x.address.postcode, cityName(x.address.city, l)].filter(Boolean).join(' ')}</span>
                  </address>
                  <dl className="kv">
                    {x.phone && <div><dt>{t('phone')}</dt><dd><a href={tel(x.phone)}>{x.phone}</a></dd></div>}
                    {x.email && <div><dt>{t('email')}</dt><dd><a href={`mailto:${x.email}`}>{x.email}</a></dd></div>}
                  </dl>
                  {osm && <a className="link" href={osm} rel="noopener">{t('directions')}</a>}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </Layout>
  );
}
