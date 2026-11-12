/** Areas: one tile per city with 3+ listings, computed from the data. */
import type { Route } from './+types/areas';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { PlacePhoto } from '../components/PlacePhoto';
import { siteData, sites } from '../lib/data.server';
import { href, langOf } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { areasOf, officeFor } from '../lib/areas';
import { areaPlace, placeAlt } from '../content/places';
import './areas.css';

export async function loader({ request }: Route.LoaderArgs) {
  const [{ org, teams }, all] = await Promise.all([siteData(), sites.allListings()]);
  const areas = areasOf(all).map((a) => {
    const here = all.filter((x) => x.address.city === a.city);
    const office = officeFor(a.city, here, teams);
    return {
      ...a,
      office: office && { city: office.address.city, name: office.name },
      buy: here.filter((x) => x.status === 'available' && x.offer_type === 'buy').length,
      rent: here.filter((x) => x.status === 'available' && x.offer_type === 'rent').length,
    };
  });
  return { l: langOf(new URL(request.url).pathname), name: org.name, areas };
}

export default function Page({ loaderData: { l, name, areas } }: Route.ComponentProps) {
  const t = tx(l);
  return (
    <Layout l={l} route="areas" title={`${t('areasPageTitle')} | ${name}`} description={t('areasLede')}>
      <section className="band on-navy">
        <div className="wrap band__inner">
          <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navAreas') }]} />
          <h1 className="h1">{t('areasPageTitle')}</h1>
          <p className="lede">{t('areasLede')}</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <ul className="plain-list tiles">
            {areas.map((a, i) => {
              const place = areaPlace(a.city, a.office?.city);
              return (
                <li key={a.slug}>
                  <a className="tile" href={href('areas', l, a.slug)}>
                    <span className="tile__media">{place && <PlacePhoto place={place} alt={placeAlt(place, l)} width={900} height={600} priority={i === 0} sizes="(min-width: 900px) 46vw, 100vw" />}</span>
                    <span className="tile__body">
                      {a.office && <span className="tile__office">{t('officeOf', { city: cityName(a.office.city, l) || a.office.name })}</span>}
                      <h2 className="h3">{t('homesIn', { city: cityName(a.city, l) })}</h2>
                      <span className="tile__n num">{[a.buy && `${t('areaForSale')} ${a.buy}`, a.rent && `${t('areaForRent')} ${a.rent}`].filter(Boolean).join(' · ')}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </Layout>
  );
}
