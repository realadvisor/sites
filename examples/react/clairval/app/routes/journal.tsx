/** Journal: the newest article large, then the others as a plain list. */
import type { Route } from './+types/journal';
import { Site } from '../components/Site';
import { PageHead } from '../components/PageHead';
import { Img } from '../components/Img';
import { siteData } from '../lib/data.server';
import { href, langOfPath } from '../lib/routes';
import { tx } from '../lib/copy';
import { dateLong } from '../lib/format';
import { POSTS } from '../content/journal';
import './journal.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const { org } = await siteData();
  return { l, orgName: org.name };
}

export default function Journal({ loaderData: { l, orgName } }: Route.ComponentProps) {
  const t = tx(l);
  const [lead, ...rest] = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  const C = {
    en: { title: 'Journal', lede: 'Practical notes from our offices on buying, selling and renting.' },
    fr: { title: 'Journal', lede: 'Des notes pratiques de nos bureaux sur l’achat, la vente et la location.' },
  }[l];
  return (
    <Site l={l} route="journal" title={`${C.title} | ${orgName}`} description={C.lede}>
      <PageHead crumbLabel={t('breadcrumb')} crumbs={[{ label: t('home'), href: href('home', l) }, { label: t('navJournal') }]} title={C.title} lede={C.lede} />
      {lead && (
        <section className="wrap">
          <a className="lead" href={href('journal', l, lead.slug)}>
            <Img src={lead.cover.url} alt={lead.cover.alt[l]} width={1200} height={800} priority sizes="(min-width: 1024px) 58vw, 100vw" />
            <span className="lead__text">
              <time dateTime={lead.date} className="muted">{dateLong(lead.date, l)}</time>
              <h2 className="h2">{lead.title[l]}</h2>
              <span className="lede">{lead.summary[l]}</span>
            </span>
          </a>
        </section>
      )}
      <ul className="plain wrap list">
        {rest.map((p) => (
          <li key={p.slug}>
            <a className="item" href={href('journal', l, p.slug)}>
              <Img src={p.cover.url} alt={p.cover.alt[l]} width={480} height={320} sizes="(min-width: 768px) 280px, 100vw" />
              <span className="item__text">
                <time dateTime={p.date} className="muted small">{dateLong(p.date, l)}</time>
                <h2 className="h3">{p.title[l]}</h2>
                <span>{p.summary[l]}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Site>
  );
}
