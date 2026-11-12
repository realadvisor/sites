/** Legal notice and privacy policy: the kit's text from the organisation data, in the site frame. Never edited here. */
import type { Route } from './+types/legal';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { legalNotice, privacyPolicy } from '@realadvisor/sites-kit/legal';
import { lang as klang, t as kt } from '@realadvisor/sites-kit/i18n';
import { analyticsId } from '@realadvisor/sites-kit/env';
import { Layout } from '../components/Layout';
import { siteData } from '../lib/data.server';
import { langOf, LOCALE } from '../lib/routes';
import './legal.css';

export async function loader({ request }: Route.LoaderArgs) {
  const { pathname } = new URL(request.url);
  const l = langOf(pathname);
  const kind = /\/privacy$/.test(pathname) ? ('privacy' as const) : ('legal' as const);
  const lg = klang(LOCALE[l]);
  const { org, primary } = await siteData();
  const agency = { id: org.id, name: org.name, phone: primary?.phone, email: primary?.email, address: org.address, website: org.website };
  const sections = kind === 'legal' ? legalNotice(agency, lg) : privacyPolicy(agency, { analytics: !!analyticsId() }, lg);
  return { l, kind, name: org.name, title: kt(kind === 'legal' ? 'legalNotice' : 'privacyPolicy', {}, lg), sections };
}

export default function Page({ loaderData: { l, kind, name, title, sections } }: Route.ComponentProps) {
  return (
    <Layout l={l} route={kind} title={`${title} | ${name}`} description={`${title} ${name}`}>
      <section className="band on-navy">
        <div className="wrap band__inner"><h1 className="h1">{title}</h1></div>
      </section>
      <div className="wrap section legal-wrap">
        <LegalContent sections={sections} />
      </div>
    </Layout>
  );
}
