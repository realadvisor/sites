// Legal notice and privacy policy: text only from the kit (built from the
// agency data), in the site's layout. Never edit the words.
import type { Route } from './+types/legal';
import { agencyOf } from '@realadvisor/sites-kit/agency';
import { LegalContent } from '@realadvisor/sites-kit-react/components/LegalContent';
import { legalNotice, privacyPolicy } from '@realadvisor/sites-kit/legal';
import { analyticsId } from '@realadvisor/sites-kit/env';
import { t } from '@realadvisor/sites-kit/i18n';
import { Site } from '../components/Site';
import { agency } from '../lib/data.server';
import { alternates, href, langOfPath } from '../lib/i18n';
import './legal.css';

export async function loader({ request }: Route.LoaderArgs) {
  const { pathname } = new URL(request.url);
  const lang = langOfPath(pathname);
  const page = pathname === href('privacy', lang) ? 'privacy' : 'legal';
  const ag = (({ org, team }) => agencyOf(org, team))(await agency());
  const sections = page === 'legal' ? legalNotice(ag, lang) : privacyPolicy(ag, { analytics: !!analyticsId() }, lang);
  return { lang, page, name: ag.name, sections } as const;
}

export default function Legal({ loaderData: { lang, page, name, sections } }: Route.ComponentProps) {
  const title = t(page === 'legal' ? 'legalNotice' : 'privacyPolicy', {}, lang);
  return (
    <Site lang={lang} title={`${title} | ${name}`} description={`${title} ${name}`} alternates={alternates(page)} switchToHome>
      <header className="phead wrap"><h1 className="display-l">{title}</h1></header>
      <div className="wrap doc"><LegalContent sections={sections} className="doc-body" /></div>
    </Site>
  );
}
