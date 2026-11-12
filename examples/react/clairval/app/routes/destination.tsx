/** One destination: photo, a short factual introduction, practical facts, places with counts, listings, more photos, the office. */
import type { Route } from './+types/destination';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { Site } from '../components/Site';
import { Crumbs } from '../components/Crumbs';
import { Img } from '../components/Img';
import { ListingCard } from '../components/ListingCard';
import { cardOf, findTeam, siteData, sites } from '../lib/data.server';
import { href, langOfPath, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { moneyRange, tel } from '../lib/format';
import { destinations, priceSpan } from '../lib/regions';
import { placeOf } from '../content/places';
import { POSTS } from '../content/journal';
import './destination.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOfPath(new URL(request.url).pathname);
  const slug = params.slug;
  if (!(await findTeam(slug))) throw notFound();
  const [{ org, teams }, all] = await Promise.all([siteData(), sites.allListings()]);
  const d = destinations(teams, all).find((x) => x.slug === slug);
  if (!d) throw notFound();
  const p = placeOf(slug);
  const sale = d.available.filter((x) => x.offer_type === 'buy');
  const rent = d.available.filter((x) => x.offer_type === 'rent');
  const photos = p?.photos.map((x) => ({ url: x.url, alt: x.alt[l] })) ?? [];
  const post = POSTS.find((x) => x.place === slug);
  const tm = d.team;
  return {
    l,
    slug,
    orgName: org.name,
    name: cityName(tm.address.city, l) || tm.name,
    line: p?.line[l],
    intro: p?.intro[l] ?? [],
    facts: p?.facts[l] ?? [],
    spans: priceSpan(sale),
    places: d.places,
    sale: sale.map(cardOf),
    rent: rent.map(cardOf),
    hero: photos[0] ?? d.available[0]?.photos[0],
    strip: photos.length > 2 ? photos.slice(1, 4) : [],
    post: post && { slug: post.slug, title: post.title[l] },
    team: { slug: teamSlug(tm, teams), address: tm.address, phone: tm.phone, email: tm.email },
  };
}

export default function Destination({ loaderData: d }: Route.ComponentProps) {
  const { l, name, team } = d;
  const t = tx(l);
  const C = {
    en: { title: `Property in ${name}`, sale: (n: number) => `${n} for sale`, rent: (n: number) => `${n} to rent`, range: 'Prices for sale', places: 'Where', forSale: `For sale in ${name}`, toRent: `To rent in ${name}`, office: `The ${name} office`, read: 'Read in the journal' },
    fr: { title: `Immobilier à ${name}`, sale: (n: number) => `${n} à vendre`, rent: (n: number) => `${n} à louer`, range: 'Prix de vente', places: 'Où', forSale: `À vendre à ${name}`, toRent: `À louer à ${name}`, office: `Le bureau de ${name}`, read: 'À lire dans le journal' },
  }[l];
  const figures = [d.sale.length ? C.sale(d.sale.length) : '', d.rent.length ? C.rent(d.rent.length) : ''].filter(Boolean);
  return (
    <Site l={l} route="destinations" segs={[d.slug]} title={`${C.title} | ${d.orgName}`} description={d.line ?? `${C.title}: ${figures.join(', ')}`}>
      <section className="hero on-ink">
        {d.hero && <Img src={d.hero} alt={d.hero.alt ?? ''} width={1600} height={800} priority sizes="100vw" mobile={{ width: 800, height: 1000 }} />}
        <span className="hero__scrim" aria-hidden="true"></span>
        <div className="wrap hero__text">
          <Crumbs tone="light" label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, { label: t('navDestinations'), href: href('destinations', l) }, { label: name }]} />
          <h1 className="h1">{C.title}</h1>
          {figures.length > 0 && <p className="label">{figures.join(' · ')}</p>}
        </div>
      </section>

      <section className="wrap intro">
        <div className="prose">{d.intro.map((x, i) => <p key={i}>{x}</p>)}</div>
        <aside>
          <dl className="facts">
            {d.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            {d.spans.map((s) => <div key={s.currency}><dt>{C.range}</dt><dd className="num">{moneyRange(s.min, s.max, s.currency, l)}</dd></div>)}
            {d.places.length > 0 && <div><dt>{C.places}</dt><dd>{d.places.map((x) => `${cityName(x.city, l)} (${x.count})`).join(', ')}</dd></div>}
          </dl>
          {d.post && <a className="link post-link" href={href('journal', l, d.post.slug)}>{C.read}: {d.post.title}</a>}
        </aside>
      </section>

      {d.sale.length > 0 && (
        <section className="wrap block">
          <h2 className="h2 block__h">{C.forSale}</h2>
          <ul className="plain grid3">{d.sale.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
        </section>
      )}

      {d.strip.length > 0 && (
        <section className="strip" aria-label={name}>
          {d.strip.map((x) => <Img key={x.url} src={x} alt={x.alt} width={800} height={600} sizes="(min-width: 768px) 33vw, 100vw" />)}
        </section>
      )}

      {d.rent.length > 0 && (
        <section className="wrap block">
          <h2 className="h2 block__h">{C.toRent}</h2>
          <ul className="plain grid3">{d.rent.map((x) => <li key={x.id}><ListingCard listing={x} l={l} /></li>)}</ul>
        </section>
      )}

      <section className="on-ink office">
        <div className="wrap office__in">
          <h2 className="h2">{C.office}</h2>
          <address>
            {team.address.street && <span>{team.address.street}</span>}
            <span>{[team.address.postcode, team.address.city].filter(Boolean).join(' ')}</span>
            {team.phone && <a className="num" href={tel(team.phone)}>{team.phone}</a>}
            {team.email && <a href={`mailto:${team.email}`}>{team.email}</a>}
          </address>
          <a className="cta cta--light" href={href('offices', l, team.slug)}>{t('navOffices')}: {name}</a>
        </div>
      </section>
    </Site>
  );
}
