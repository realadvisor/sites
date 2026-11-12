/**
 * Home (/ and /en): the façade full-bleed with the name and two buttons, the
 * figures a buyer needs, the building (CRM description + credits), the two
 * wings, types and prices as a plain table, one roof-terrace photo with one
 * line, the works, the neighbourhood, the sales team.
 */
import type { Route } from './+types/home';
import { sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Layout } from '../components/Layout';
import { Photo } from '../components/Photo';
import { People, person } from '../components/People';
import { developmentExtra, legalAgency, loadSite } from '../lib/data.server';
import { CONTENT_LANG, alternates, fill, href, langOfPath, tr } from '../lib/i18n';
import { docHref } from '../lib/docs';
import {
  KINDS, WINGS, deliveryLabel, floorsOf, formatAmount, fromPrice, kindLabel, kindOf, m2Range, outdoor, range, wingOf, type Wing,
} from '../lib/units.server';
import { WING_ADDRESS } from '../content/site';
import { PLACES } from '../content/barrio';
import './home.css';

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const t = tr(lang);
  const site = await loadSite();
  const { dev } = site;
  const extra = developmentExtra(dev); // fixture only: construction photos
  const units = dev.units;
  const [cover, ...rest] = dev.photos;
  const delivery = deliveryLabel(dev, lang);
  const deliveryShort = dev.delivery_date ? new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', { month: 'short', year: 'numeric' }).format(new Date(dev.delivery_date)).replace(/\.$/, '') : '';
  const priceMin = fromPrice(units);
  const sizes = range(units.flatMap((u) => (u.living_surface ? [u.living_surface] : [])));
  const avail = (us: typeof units) => us.filter((u) => u.status === 'available').length;
  const wings = WINGS.map((w: Wing) => {
    const us = units.filter((u) => wingOf(u) === w);
    const fs = floorsOf(units, w);
    const lo = Math.min(...fs);
    const hi = Math.max(...fs);
    return {
      w,
      count: us.length,
      available: avail(us),
      floors: lo === 0 ? fill(t.wingFloorsGround, { b: hi }) : fill(t.wingFloors, { a: lo, b: hi }),
      photo: us.flatMap((u) => u.photos ?? [])[0],
    };
  });
  const types = KINDS.map((k) => {
    const us = units.filter((u) => kindOf(u) === k);
    const size = range(us.flatMap((u) => (u.living_surface ? [u.living_surface] : [])));
    const from = fromPrice(us);
    return { k, label: kindLabel(k, lang, 2), n: us.length, available: avail(us), size: m2Range(size), from: from ? formatAmount(from) : null };
  }).filter((x) => x.n > 0);
  const roof = range(units.filter((u) => kindOf(u) === 'atico').map(outdoor).filter((o) => o?.kind === 'terrace').map((o) => o!.m2));
  const roofPhoto = dev.photos.find((p) => p.url.includes('9584741')) ?? rest[rest.length - 1];
  const tilePhoto = dev.photos.find((p) => p.url.includes('5505437')) ?? rest[0];
  const credits = (['developer', 'architect', 'general_contractor'] as const).flatMap((k) => { const v = dev[k]?.name; return v ? [{ k, v }] : []; });
  const title = lang === 'es' ? `${dev.title} | Obra nueva en Russafa, València` : `${dev.title} | New homes in Russafa, València`;
  const desc = `${fill(t.heroLead, { n: dev.stats.units })} ${t.figDelivery[0]!.toUpperCase()}${t.figDelivery.slice(1)}: ${delivery}.`;
  return {
    lang,
    title,
    desc,
    jsonLd: agencyJsonLd(legalAgency(site), new URL('/', siteUrl()).href),
    dev: { title: dev.title, description: dev.description, stats: dev.stats },
    cover: cover?.url,
    figs: { priceMin: priceMin ? formatAmount(priceMin) : null, sizes: sizes ? m2Range(sizes) : null, delivery, deliveryShort },
    tilePhoto: tilePhoto?.url,
    credits,
    wings,
    types,
    roof,
    roofPhoto: roofPhoto?.url,
    works: (extra.construction_photos ?? []).slice(0, 4),
    market: PLACES[0]!,
    people: site.people.map(person),
  };
}

export default function Home({ loaderData: d }: Route.ComponentProps) {
  const { lang, dev, figs } = d;
  const t = tr(lang);
  const market = d.market;
  return (
    <Layout lang={lang} route="home" title={d.title} description={d.desc} image={d.cover && img(d.cover, { w: 1200, h: 630 })} jsonLd={d.jsonLd} alternates={alternates('home')} page="pg-home">
      <section className="hero" data-hero="">
        {d.cover && <Photo src={d.cover} alt={lang === 'es' ? 'Fachada de 1908 de Casa de les Rajoles, con balcones de forja y galerías de madera' : 'The 1908 façade of Casa de les Rajoles, with wrought-iron balconies and timber galleries'} width={1600} height={820} priority sizes="100vw" mobile={{ width: 800, height: 900 }} className="hero-img" position="50% 45%" />}
        <div className="hero-panel">
          <div className="wrap">
            <h1>{dev.title}</h1>
            <p className="lead">{fill(t.heroLead, { n: dev.stats.units })}</p>
            <p className="actions">
              <a className="cta coral" href={href('units', lang)}>{t.seeUnits}</a>
              <a className="cta ghost" href={docHref('dossier', lang)}>{t.dossierPdf}</a>
            </p>
          </div>
        </div>
      </section>

      <section className="wrap figs" aria-label={lang === 'es' ? 'Datos clave' : 'Key figures'}>
        <dl>
          <div><dt>{fill(t.figAvailable, { n: dev.stats.units })}</dt><dd className="num">{dev.stats.available}</dd></div>
          {figs.priceMin && <div><dt>{t.figFrom}</dt><dd className="num">{figs.priceMin}</dd></div>}
          {figs.sizes && <div><dt>{t.figSizes}</dt><dd className="num">{figs.sizes}</dd></div>}
          {figs.delivery && <div><dt>{t.figDelivery}</dt><dd className="cap">{figs.deliveryShort}</dd></div>}
        </dl>
      </section>

      <section className="wrap building" aria-labelledby="b-h">
        <div className="b-text">
          <h2 id="b-h">{t.buildingTitle}</h2>
          {dev.description && <div className="prose" lang={CONTENT_LANG} dangerouslySetInnerHTML={{ __html: sanitizeHtml(dev.description) }} />}
          {d.credits.length > 0 && (
            <dl className="credits">
              {d.credits.map(({ k, v }) => <div key={k}><dt>{t.credits[k]}</dt><dd>{v}</dd></div>)}
            </dl>
          )}
        </div>
        {d.tilePhoto && <Photo src={d.tilePhoto} alt={lang === 'es' ? 'Suelo hidráulico original, estrellas verdes y grises' : 'Original encaustic tile floor, green and grey stars'} width={720} height={900} sizes="(min-width: 900px) 40vw, 100vw" className="b-img" />}
      </section>

      <section className="wrap wings" aria-labelledby="w-h">
        <h2 id="w-h">{t.wingsTitle}</h2>
        <div className="w-grid">
          {d.wings.map((x) => (
            <article className="wing" key={x.w}>
              {x.photo && <Photo src={x.photo.url} alt={x.photo.alt} lang={CONTENT_LANG} width={800} height={560} sizes="(min-width: 900px) 46vw, 100vw" />}
              <div className="w-body">
                <h3>{t.wings[x.w]}</h3>
                <p className="w-meta">{WING_ADDRESS[x.w]} · {x.floors}</p>
                <p>{t.wingText[x.w]}</p>
                <p className="w-count"><b className="num">{fill(t.wingCount, { n: x.count, a: x.available })}</b></p>
                <a className="link" href={`${href('units', lang)}?ala=${x.w}#planta`}>{t.seeWing}<span className="visually-hidden">: {t.wings[x.w]}</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap types" aria-labelledby="t-h">
        <div className="t-intro">
          <h2 id="t-h">{t.typesTitle}</h2>
          <p className="muted">{t.typesNote}</p>
          <a className="cta ghost" href={href('plans', lang)}>{t.allPlans}</a>
        </div>
        <table>
          <thead><tr><th scope="col">{t.colType}</th><th scope="col" className="r">{t.colSize}</th><th scope="col" className="r">{t.colAvail}</th><th scope="col" className="r">{t.colFrom}</th></tr></thead>
          <tbody>
            {d.types.map((x) => (
              <tr key={x.k}>
                <th scope="row"><a href={`${href('plans', lang)}?tipo=${x.k}`}>{x.label}</a></th>
                <td className="r num">{x.size}</td>
                <td className="r num">{x.available} / {x.n}</td>
                <td className="r num">{x.from ?? <span className="muted">{x.available ? t.onRequest : t.soldOut}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {d.roofPhoto && d.roof && (
        <section className="roof">
          <Photo src={d.roofPhoto} alt={lang === 'es' ? 'Terraza de ático con pérgola sobre los tejados' : 'Penthouse terrace with a pergola over the rooftops'} width={1600} height={760} sizes="100vw" mobile={{ width: 800, height: 900 }} />
          <p className="wrap"><span>{fill(t.roofLine, { a: d.roof.min, b: d.roof.max })}</span></p>
        </section>
      )}

      {d.works.length > 0 && (
        <section className="wrap works" aria-labelledby="o-h">
          <div className="o-text">
            <h2 id="o-h">{t.worksTitle}</h2>
            <p>{fill(t.worksText, { d: figs.delivery })}</p>
            <a className="link" href={`${href('gallery', lang)}#obras`}>{t.galleryWorks}</a>
          </div>
          <div className="o-grid">
            {d.works.map((src, i) => <Photo key={src} src={src} alt={lang === 'es' ? `Obras de Casa de les Rajoles, foto ${i + 1}` : `Casa de les Rajoles under construction, photo ${i + 1}`} width={600} height={i % 3 ? 440 : 600} sizes="(min-width: 900px) 22vw, 50vw" />)}
          </div>
        </section>
      )}

      <section className="wrap area" aria-labelledby="a-h">
        {market.photo && <Photo src={market.photo} alt={market.alt?.[lang] ?? market.name[lang]} width={900} height={640} sizes="(min-width: 900px) 50vw, 100vw" />}
        <div>
          <h2 id="a-h">{t.areaTitle}</h2>
          <p>{t.areaText}</p>
          <a className="link" href={href('area', lang)}>{t.areaLink}</a>
        </div>
      </section>

      <section className="wrap contact" aria-labelledby="c-h">
        <div>
          <h2 id="c-h">{t.contactTitle}</h2>
          <p>{t.contactText}</p>
          <a className="cta coral" href={href('contact', lang)}>{t.contactCta}</a>
        </div>
        <People people={d.people} lang={lang} />
      </section>
    </Layout>
  );
}
