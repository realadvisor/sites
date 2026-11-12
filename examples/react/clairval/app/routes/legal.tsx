/** Legal notice and privacy policy: the kit's text from the organisation data, in the site frame. Never edited here. */
import type { Route } from './+types/legal';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { legalNotice, privacyPolicy } from '@realadvisor/sites-kit-core/legal';
import { lang as klang, t as kt } from '@realadvisor/sites-kit-core/i18n';
import { analyticsId } from '@realadvisor/sites-kit-core/env';
import { Site } from '../components/Site';
import { PageHead } from '../components/PageHead';
import { legalAgency, siteData } from '../lib/data.server';
import { LOCALE, ROUTES, langOfPath } from '../lib/routes';
import './legal.css';

export async function loader({ request }: Route.LoaderArgs) {
  const path = new URL(request.url).pathname;
  const l = langOfPath(path);
  const kind = path === ROUTES.privacy[l] ? ('privacy' as const) : ('legal' as const);
  const lg = klang(LOCALE[l]);
  const s = await siteData();
  const agency = legalAgency(s);
  const title = kt(kind === 'legal' ? 'legalNotice' : 'privacyPolicy', {}, lg);
  const sections = kind === 'legal' ? legalNotice(agency, lg) : privacyPolicy(agency, { analytics: !!analyticsId() }, lg);
  return { l, kind, title, orgName: s.org.name, sections };
}

export default function Legal({ loaderData: { l, kind, title, orgName, sections } }: Route.ComponentProps) {
  return (
    <Site l={l} route={kind} title={`${title} | ${orgName}`} description={`${title} ${orgName}`}>
      <PageHead title={title} />
      <div className="wrap legal-wrap">
        <LegalContent sections={sections} />
      </div>
    </Site>
  );
}
