/**
 * Listing page: title and price, 1 + 4 gallery (a swipe strip with counters
 * on the phone), facts, description, features, energy label, every photo,
 * approximate location; the advisor card with the enquiry form sticks
 * beside it. Unknown slug: the 404 page (410 for a listing that left).
 */
import type { Route } from './+types/listing';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { useKit } from '@realadvisor/sites-kit-react/components/Document';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { listingIdFromSlug, sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { featureLabel, lang as klang, t as kt } from '@realadvisor/sites-kit/i18n';
import { listingJsonLd, listingRef, listingTitle } from '@realadvisor/sites-kit/seo';
import { Layout } from '../components/Layout';
import { Crumbs } from '../components/Crumbs';
import { ListingCard } from '../components/ListingCard';
import { StaticMap } from '../components/StaticMap';
import { EnergyScale } from '../components/EnergyScale';
import { Img } from '../components/Img';
import { extras, siteData, sites } from '../lib/data.server';
import { extraNum, extraStr } from '../lib/extras';
import { agentSlug, href, langOf, listingHref, LOCALE, teamSlug } from '../lib/routes';
import { cityName, tx } from '../lib/copy';
import { floor, formatAmount, formatSurface, price, tel, typeLabel } from '../lib/format';
import './listing.css';

export async function loader({ request, params }: Route.LoaderArgs) {
  const l = langOf(new URL(request.url).pathname);
  const x = await sites.listing(params.slug);
  // A slug that ends with a listing id was a listing of this site: 410 Gone.
  if (!x) throw notFound(!!listingIdFromSlug(params.slug));
  const [{ teams, agents }, sameCity] = await Promise.all([siteData(), x.address.city ? sites.allListings({ city: x.address.city }) : Promise.resolve([])]);
  const agent = x.agent ? (agents.find((a) => a.id === x.agent!.id) ?? x.agent) : undefined;
  const team = teams.find((tm) => x.team_ids.includes(tm.id)) ?? teams.find((tm) => agent?.team_ids.includes(tm.id));
  return {
    l,
    x,
    ex: extras('listings', [x.id]),
    title: listingTitle(x, sameCity),
    similar: sameCity.filter((y) => y.id !== x.id && y.status === 'available').slice(0, 3),
    agent: agent && { ...agent, slug: agentSlug(agent, agents) },
    team: team && { ...team, slug: teamSlug(team, teams) },
  };
}

export default function Page({ loaderData: { l, x, ex, title, similar, agent, team } }: Route.ComponentProps) {
  const t = tx(l);
  const locale = LOCALE[l];
  const kit = useKit();
  const isRent = x.offer_type === 'rent';
  const sold = x.status === 'sold';
  const city = cityName(x.address.city, l);
  // fixture only: energy class, year built, floor, terrace / balcony surface, monthly charges
  const energy = extraStr(ex, x.id, 'energy_class');
  const year = extraNum(ex, x.id, 'year_built');
  const fl = extraNum(ex, x.id, 'floor');
  const terrace = extraNum(ex, x.id, 'terrace_surface');
  const balcony = extraNum(ex, x.id, 'balcony_surface');
  const charges = extraNum(ex, x.id, 'charges');
  const facts = [
    x.rooms != null && { k: t('rooms'), v: String(x.rooms) },
    x.bedrooms != null && { k: t('bedrooms'), v: String(x.bedrooms) },
    x.bathrooms != null && { k: t('bathrooms'), v: String(x.bathrooms) },
    x.living_surface != null && { k: t('livingArea'), v: formatSurface(x.living_surface) },
    x.land_surface != null && { k: t('landArea'), v: formatSurface(x.land_surface) },
    terrace != null && { k: t('terrace'), v: formatSurface(terrace) },
    balcony != null && { k: t('balcony'), v: formatSurface(balcony) },
    fl != null && { k: t('floor'), v: floor(fl, l) },
    year != null && { k: t('yearBuilt'), v: String(year) },
  ].filter(Boolean) as { k: string; v: string }[];
  const photos = x.photos;
  const back = isRent ? { label: t('navRent'), href: href('rent', l) } : sold ? { label: t('navSold'), href: href('sold', l) } : { label: t('navBuy'), href: href('buy', l) };
  const pageUrl = new URL(listingHref(x, l), kit.siteUrl).href;
  const where = [x.address.street, [x.address.postcode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const ref = listingRef({ id: x.id, reference: x.reference });
  const alt = (i: number) => photos[i]?.alt || `${typeLabel(x.property_type, l)} ${city}, ${t('photo', { n: i + 1 })}`;
  const phone = agent?.phone ?? team?.phone;
  return (
    <Layout l={l} route="listing" segs={[x.slug]} section={isRent ? 'rent' : sold ? 'sold' : 'buy'}
      title={`${title} | ${price(x, l)}`}
      description={(x.description_text ?? x.title).replace(/\s+/g, ' ').slice(0, 155)}
      image={photos[0] && img(photos[0].url, { w: 1200, h: 630 })}
      jsonLd={listingJsonLd(x, pageUrl)}
      noindex={sold}>

      <div className="wrap top">
        <Crumbs label={t('breadcrumb')} items={[{ label: t('home'), href: href('home', l) }, back, { label: x.title }]} />
        <div className="intro">
          <div className="intro__main">
            <p className="eyebrow">{isRent ? t('forRent') : sold ? t('sold') : t('forSale')} · {typeLabel(x.property_type, l)}</p>
            <h1 className="h1 title">{x.title}</h1>
            {where && <p className="where">{where}</p>}
          </div>
          <div className="intro__price">
            {!sold && <p className="price num">{price(x, l)}</p>}
            {isRent && charges != null && <p className="charges num">+ {t('charges')} {formatAmount(charges)} {t('perMonth')}</p>}
            <p className="ref">{t('reference')} {ref}</p>
          </div>
        </div>
      </div>

      {photos.length > 0 ? (
        <div className="wrap">
          <div className={`gal gal--${Math.min(photos.length, 5)}`}>
            {photos.slice(0, 5).map((p, i) => (
              <a key={i} className="gal__item" href={photos.length > 5 ? `#photo-${i + 1}` : undefined}>
                <Img src={p} alt={alt(i)} width={i === 0 ? 1200 : 600} height={i === 0 ? 800 : 400} priority={i === 0}
                  sizes={i === 0 ? '(min-width: 1360px) 760px, (min-width: 761px) 56vw, 88vw' : '(min-width: 1360px) 300px, (min-width: 761px) 22vw, 88vw'} />
                {i === 4 && photos.length > 5 && <span className="gal__more">{t('allPhotos', { n: photos.length })}</span>}
                <span className="gal__n num" aria-hidden="true">{i + 1} / {photos.length}</span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="wrap"><div className="nophoto">{t('noPhoto')}</div></div>
      )}

      <div className="wrap body">
        <div className="main">
          {facts.length > 0 && (
            <section aria-labelledby="h-facts">
              <h2 id="h-facts" className="sec-h">{t('facts')}</h2>
              <dl className="facts">
                {facts.map((f) => <div key={f.k}><dt>{f.k}</dt><dd className="num">{f.v}</dd></div>)}
              </dl>
            </section>
          )}
          {x.description && (
            <section aria-labelledby="h-desc">
              <h2 id="h-desc" className="sec-h">{t('description')}</h2>
              <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(x.description) }} />
            </section>
          )}
          {x.features.length > 0 && (
            <section aria-labelledby="h-feat">
              <h2 id="h-feat" className="sec-h">{t('features')}</h2>
              <ul className="feats">{x.features.map((f) => <li key={f}>{featureLabel(f, locale)}</li>)}</ul>
            </section>
          )}
          {energy && (
            <section aria-labelledby="h-energy">
              <h2 id="h-energy" className="sec-h">{t('energy')}</h2>
              <EnergyScale value={energy} label={t('energy')} classLabel={t('energyClass', { c: energy })} />
            </section>
          )}
          {photos.length > 5 && (
            <section aria-labelledby="h-photos" className="allph">
              <h2 id="h-photos" className="sec-h">{t('photos')} <span className="num">({photos.length})</span></h2>
              <ul>
                {photos.map((p, i) => (
                  <li key={i} id={`photo-${i + 1}`}><Img src={p} alt={alt(i)} width={1200} height={800} fit="fit" sizes="(min-width: 1360px) 820px, (min-width: 900px) 60vw, 100vw" /></li>
                ))}
              </ul>
            </section>
          )}
          {x.address.lat != null && x.address.lng != null && (
            <section aria-labelledby="h-loc">
              <h2 id="h-loc" className="sec-h">{t('location')}</h2>
              <p className="muted">{[city, t('approxLocation')].filter(Boolean).join(' · ')}</p>
              <StaticMap lat={x.address.lat} lng={x.address.lng} zoom={14} area label={`${t('location')}: ${city}`} linkLabel={t('openMap')} />
            </section>
          )}
        </div>

        <aside className="side" id="contact" aria-label={t('yourAdvisor')}>
          <div className="side__card">
            {agent && (
              <div className="adv">
                {agent.photo?.url && <Img className="adv__photo" src={agent.photo} alt={`${agent.first_name} ${agent.last_name}`} width={128} height={160} sizes="64px" />}
                <div>
                  <p className="adv__k">{t('yourAdvisor')}</p>
                  <p className="adv__name"><a href={href('team', l, agent.slug)}>{agent.first_name} {agent.last_name}</a></p>
                  {team && <p className="adv__team"><a href={href('offices', l, team.slug)}>{t('officeOf', { city: cityName(team.address.city, l) || team.name })}</a></p>}
                </div>
              </div>
            )}
            {phone && (
              <p className="adv__tel"><a className="button button--ghost" href={tel(phone)}>{t('call')} <span className="num">{phone}</span></a></p>
            )}
            <h2 className="side__h">{sold ? t('soldCta') : t('askAbout')}</h2>
            <EnquiryForm locale={locale} listingId={x.id} agentId={agent?.id} agentName={agent?.first_name}
              message={kt('interested', { title: x.title, ref }, klang(locale))} />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section section--paper">
          <div className="wrap">
            <div className="head"><h2 className="h2">{t('similar')}</h2></div>
            <ul className="plain-list grid grid--3">{similar.map((y) => <li key={y.id}><ListingCard listing={y} l={l} /></li>)}</ul>
          </div>
        </section>
      )}

      <div className="mbar">
        <a className="button" href="#contact">{t('askAbout')}</a>
        {phone && <a className="button button--ghost" href={tel(phone)}>{t('call')}</a>}
      </div>
    </Layout>
  );
}
