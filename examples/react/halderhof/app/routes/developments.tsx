/** New developments: one large card per development with its figures and prices per unit type. */
import type { Route } from './+types/developments';
import { Site } from '../components/Site';
import { Img } from '../components/Img';
import { PageBand } from '../components/PageBand';
import { siteData, sites, unitExtras } from '../lib/data.server';
import { groupLine, groups } from '../lib/dev';
import { href, langOfPath } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { formatAmount, monthYear, roomsRange } from '../lib/format';
import './developments.css';

export async function loader({ request }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const [{ org }, list] = await Promise.all([siteData(), sites.developments()]);
  const full = (await Promise.all(list.map((d) => sites.development(d.slug)))).filter((d) => d !== null);
  const devs = full.map((d) => ({
    id: d.id, slug: d.slug, title: d.title, city: d.address.city, delivery_date: d.delivery_date, stats: d.stats, photo: d.photos[0],
    groups: groups(d.units, l, unitExtras(d.units)).map((g) => ({ key: g.key, label: g.label, line: groupLine(g, l) })),
  }));
  return { l, orgName: org.name, devs };
}

export default function Developments({ loaderData: { l, orgName, devs } }: Route.ComponentProps) {
  const t = tx(l);
  return (
    <Site l={l} route="developments" title={`${t('devTitle')} | ${orgName}`} description={t('devLede')}>
      <PageBand l={l} title={t('devTitle')} lede={t('devLede')} crumbs={[{ label: t('navNew') }]} />
      <div className="wrap section list">
        {devs.map((d, i) => (
          <article key={d.id} className="dev">
            <a className="dev__media" href={href('developments', l, d.slug)} tabIndex={-1} aria-hidden="true">
              {d.photo && <Img src={d.photo} alt="" width={1200} height={800} sizes="(min-width: 1000px) 55vw, 100vw" priority={i === 0} />}
            </a>
            <div className="dev__body">
              <p className="kicker">{[cityName(d.city, l), d.delivery_date && t('deliveryFrom', { d: monthYear(d.delivery_date, l) })].filter(Boolean).join(' · ')}</p>
              <h2 className="h2"><a href={href('developments', l, d.slug)}>{d.title}</a></h2>
              <p className="muted">{[t('unitsAvailable', { n: d.stats.available, t: d.stats.units }), roomsRange(d.stats.rooms, l), d.stats.price && t('priceFrom', { p: formatAmount(d.stats.price.min) })].filter(Boolean).join(' · ')}</p>
              <ul className="plain-list pa">
                {d.groups.map((g) => <li key={g.key}><span className="pa__type">{g.label}</span><span className="num">{g.line.price}</span><span className="pa__status">{g.line.status}</span></li>)}
              </ul>
              <a className="button" href={href('developments', l, d.slug)}>{t('toDevelopment')}</a>
            </div>
          </article>
        ))}
      </div>
    </Site>
  );
}
