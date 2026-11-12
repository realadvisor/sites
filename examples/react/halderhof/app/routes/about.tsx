/** About: the firm in plain text, today's facts computed from the data, and the three offices. */
import type { Route } from './+types/about';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { PageBand } from '../components/PageBand';
import { siteData, sites } from '../lib/data.server';
import { ABOUT } from '../content/about';
import { placeOf } from '../content/places';
import { href, langOfPath, teamSlug } from '../lib/routes';
import { cityName, joinList, langNames, tx } from '../lib/copy';
import './about.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org, teams, agents }, live] = await Promise.all([siteData(), sites.allListings({ status: 'available' })]);
  return {
    l, orgName: org.name,
    teams: teams.map((x) => ({ id: x.id, name: x.name, city: x.address.city, slug: teamSlug(x, teams) })),
    advisers: agents.length,
    listings: live.length,
    langCodes: [...new Set(agents.flatMap((a) => a.languages ?? []))],
  };
}

export default function About({ loaderData: { l, orgName, teams, advisers, listings, langCodes } }: Route.ComponentProps) {
  const t = tx(l);
  const cities = joinList(teams.map((x) => cityName(x.city, l)).filter(Boolean), l);
  const langs = langNames(langCodes, l);
  const facts = [
    { k: t('factOffices'), v: String(teams.length), h: href('offices', l) },
    { k: t('factAdvisers'), v: String(advisers), h: href('team', l) },
    { k: t('factListings'), v: String(listings), h: href('buy', l) },
    langs && { k: t('factLanguages'), v: langs },
  ].filter(Boolean) as { k: string; v: string; h?: string }[];
  return (
    <Site l={l} route="about" title={`${t('aboutTitle', { name: orgName })}`} description={t('aboutLede', { name: orgName, cities })}>
      <PageBand l={l} title={t('aboutTitle', { name: orgName })} lede={t('aboutLede', { name: orgName, cities })} crumbs={[{ label: t('navAbout') }]} />
      <div className="wrap section cols">
        <div className="text">
          {ABOUT[l].map((s) => (
            <section key={s.h}>
              <h2 className="h3">{s.h}</h2>
              <p>{s.p}</p>
            </section>
          ))}
        </div>
        <aside className="facts" aria-labelledby="h-today">
          <h2 id="h-today" className="h3">{t('aboutFacts')}</h2>
          <dl>{facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd>{f.h ? <a className="num" href={f.h}>{f.v}</a> : f.v}</dd></div>)}</dl>
        </aside>
      </div>
      <section className="offices" aria-label={t('navOffices')}>
        <ul className="plain-list offices__row">
          {teams.map((x) => {
            const place = placeOf(x.slug, 1);
            return (
              <li key={x.id}>
                <a href={href('offices', l, x.slug)}>
                  {place && <Img src={place.photo} alt={place.alt[l]} width={800} height={560} sizes="(min-width: 800px) 33vw, 100vw" />}
                  <span>{t('officeOf', { city: cityName(x.city, l) || x.name })}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </Site>
  );
}
