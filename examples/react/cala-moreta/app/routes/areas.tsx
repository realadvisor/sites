import type { Route } from './+types/areas';
import { Site } from '../components/Site';
import { Photo } from '../components/Photo';
import { PHOTOS, photoOg } from '../lib/photos';
import { agency, brandName, sites } from '../lib/data.server';
import { towns } from '../lib/data';
import { areasOf } from '../content/content.server';
import { UI, alternates, fill, href, langOfPath } from '../lib/i18n';
import './areas.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, all] = await Promise.all([agency(), sites.allListings()]);
  const texts = areasOf(lang);
  const list = towns(all).map((t) => {
    const text = texts.find((x) => x.id === `${lang}/${t.slug}`);
    return { name: t.name, slug: t.slug, n: t.listings.length, tagline: text?.tagline, photo: text?.photo ?? ('home' as const) };
  });
  // Smaller towns (fewer listings) get no page: they link to the search.
  const big = new Set(list.map((t) => t.slug));
  const small = towns(all.filter((l) => l.status === 'available'), 1)
    .filter((t) => !big.has(t.slug))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((t) => ({ name: t.name, slug: t.slug, n: t.listings.length, offer: t.listings.some((l) => l.offer_type === 'buy') ? ('buy' as const) : ('rent' as const) }));
  return { lang, name: brandName(ag), list, small };
}

export default function Areas({ loaderData: { lang, name, list, small } }: Route.ComponentProps) {
  const ui = UI[lang];
  // Tiles that span two columns (see the grid rule in the styles).
  const wide = (i: number) => (list.length % 3 !== 0 && i === 0) || (list.length % 3 === 1 && list.length > 1 && i === list.length - 1);
  return (
    <Site lang={lang} current="areas" title={`${ui.areasH1} | ${name}`} description={ui.areasIntro}
      image={photoOg(PHOTOS[list[0]?.photo ?? 'home'])} alternates={alternates('areas')}>
      <header className="phead wrap">
        <h1 className="display-l">{ui.areasH1}</h1>
        <p className="lead">{ui.areasIntro}</p>
      </header>
      <section className="wrap tiles-wrap">
        <ul className="tiles">
          {list.map((t, i) => (
            <li className="tile" key={t.slug}>
              <div className="tile-photo"><Photo photo={PHOTOS[t.photo]} lang={lang} decorative landscapeAt={wide(i) ? true : '(max-width: 900px)'} sizes={wide(i) ? '(min-width: 900px) 62vw, 100vw' : '(min-width: 900px) 30vw, 100vw'} priority={i === 0} /></div>
              <p className="tile-n num">{fill(ui.areaCount, { n: t.n })}</p>
              <h2 className="tile-name"><a href={href('areas', lang, t.slug)}>{t.name}</a></h2>
              {t.tagline && <p className="tile-tag">{t.tagline}</p>}
            </li>
          ))}
        </ul>
        {small.length > 0 && (
          <div className="more">
            <h2 className="display-m">{ui.otherAreas}</h2>
            <ul>{small.map((t) => <li key={t.slug}><a href={`${href(t.offer, lang)}?city=${encodeURIComponent(t.name)}`}>{t.name}</a> <span className="num">{t.n}</span></li>)}</ul>
          </div>
        )}
      </section>
    </Site>
  );
}
