/** Legal notice and privacy policy (/legal, /privacy, /de/legal, /de/privacy): the kit's text from the organisation data, in the site frame. Never edited here. */
import type { Route } from './+types/legal';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { legalNotice, privacyPolicy } from '@realadvisor/sites-kit-core/legal';
import { t } from '@realadvisor/sites-kit-core/i18n';
import { analyticsId } from '@realadvisor/sites-kit-core/env';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { legalAgency, loadSite } from '../lib/data.server';
import { langOf } from '../lib/routes';
import './legal.css';

export async function loader({ request }: Route.LoaderArgs) {
  const path = new URL(request.url).pathname;
  const l = langOf(path);
  const kind = path.replace(/\/$/, '').endsWith('/privacy') ? ('privacy' as const) : ('legal' as const);
  const site = await loadSite(request);
  const agency = legalAgency(site);
  const sections = kind === 'legal' ? legalNotice(agency, l) : privacyPolicy(agency, { analytics: !!analyticsId() }, l);
  return { l, kind, sections, dev: site.dev.title, org: site.org.name, cover: site.dev.photos[0]?.url };
}

export default function Legal({ loaderData: { l, kind, sections, dev, org, cover } }: Route.ComponentProps) {
  const title = t(kind === 'legal' ? 'legalNotice' : 'privacyPolicy', {}, l);
  return (
    <Layout l={l} route={kind} scope="v-legal" title={`${title} | ${dev}`} description={`${title}, ${org}`} image={cover ? img(cover, { w: 1200, h: 630 }) : undefined}>
      <div className="wrap page">
        <h1 className="h1">{title}</h1>
        <div className="body"><LegalContent sections={sections} /></div>
      </div>
    </Layout>
  );
}
