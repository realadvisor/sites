/** Developments list: one programme card per development (render, status, place, from price, availability). */
import type { Route } from './+types/developments';
import { developmentStatus } from '@realadvisor/sites-kit/developments';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { Img } from '../components/Img';
import { sites } from '../lib/data.server';
import { href, langOf } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { formatAmount, formatSurface, monthYear, range, roomsRange } from '../lib/format';
import './developments.css';

export async function loader({ request }: Route.LoaderArgs) {
  const [org, devs] = await Promise.all([sites.organisation(), sites.developments()]);
  return { l: langOf(new URL(request.url).pathname), name: org.name, devs };
}

export default function Page({ loaderData: { l, name, devs } }: Route.ComponentProps) {
  const t = tx(l);
  return (
    <Layout l={l} route="developments" title={`${t('devTitle')} | ${name}`} description={t('devLede')}>
      <section className="band on-navy">
        <div className="wrap band__inner">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navNew') }]} />
          <h1 className="h1">{t('devTitle')}</h1>
          <p className="lede">{t('devLede')}</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <ul className="plain-list progs">
            {devs.map((d, i) => {
              const status = developmentStatus({ status: d.status }, l);
              return (
                <li key={d.id}>
                  <article className="prog">
                    <a className="prog__media" href={href('developments', l, d.slug)} tabIndex={-1} aria-hidden="true">
                      {d.photos[0] && <Img src={d.photos[0]} alt="" width={1200} height={760} priority={i === 0} sizes="(min-width: 1024px) 60vw, 100vw" />}
                      {status && <span className="prog__tag">{status}</span>}
                    </a>
                    <div className="prog__body">
                      <span className="prog__city">{cityName(d.address.city, l)}</span>
                      <h2 className="h2"><a href={href('developments', l, d.slug)}>{d.title}</a></h2>
                      {d.description_text && <p className="prog__text">{d.description_text.split('\n')[0]}</p>}
                      <dl className="kv">
                        {d.stats.units > 0 && <div><dt>{t('units')}</dt><dd>{t('unitsAvailable', { n: d.stats.available, t: d.stats.units })}</dd></div>}
                        {d.stats.price?.min && <div><dt>{t('price')}</dt><dd>{t('priceFrom', { p: formatAmount(d.stats.price.min) })}</dd></div>}
                        {d.stats.rooms && <div><dt>{t('rooms')}</dt><dd>{roomsRange(d.stats.rooms, l)}</dd></div>}
                        {d.stats.living_surface && <div><dt>{t('livingArea')}</dt><dd>{range(d.stats.living_surface, (n) => formatSurface(n))}</dd></div>}
                        {d.delivery_date && <div><dt>{t('delivery')}</dt><dd>{monthYear(d.delivery_date, l)}</dd></div>}
                      </dl>
                      <a className="button" href={href('developments', l, d.slug)}>{t('discover')}</a>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </Layout>
  );
}
