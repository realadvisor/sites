import type { Route } from './+types/listing';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { ListingsMap } from '@realadvisor/sites-kit-react/components/ListingsMap';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { canonical } from '@realadvisor/sites-kit-react/server/kit';
import { listingRef } from '@realadvisor/sites-kit-react/lib/records';
import { sanitizeHtml, listingIdFromSlug } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { formatAmount, formatSurface } from '@realadvisor/sites-kit/format';
import { featureLabel, offerTypeLabel, propertyTypeLabel, t } from '@realadvisor/sites-kit/i18n';
import { listingJsonLd, listingTitle } from '@realadvisor/sites-kit/seo';
import { Layout } from '../components/Layout';
import { Gallery } from '../components/Gallery';
import { EnergyScale } from '../components/EnergyScale';
import { Collection } from '../components/Collection';
import { areas, site, sites } from '../lib/data.server';
import { agentUrl, areaUrl, listingUrl } from '../lib/urls';
import { fullName, languages, price, rooms, telHref } from '../lib/format';
import './objekte-slug.css';

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug;
  const l = await sites.listing(slug);
  // Not found: the site's 404 page with a real 404. A slug ending with a listing id was a listing of this site that left: 410.
  if (!l) throw notFound(!!listingIdFromSlug(slug));
  const city = l.address.city;
  const [s, sameCity, sameOffer, areaList] = await Promise.all([
    site(),
    city ? sites.allListings({ city }) : Promise.resolve([]),
    sites.listings({ offer_type: l.offer_type, status: 'available', limit: 12 }),
    areas(),
  ]);
  const area = city ? areaList.find((a) => a.city === city) : undefined;
  const similarLocal = sameCity.filter((x) => x.id !== l.id && x.status === 'available' && x.offer_type === l.offer_type);
  const similar = (similarLocal.length >= 3 ? similarLocal : [...similarLocal, ...sameOffer.data.filter((x) => x.id !== l.id && !similarLocal.includes(x))]).slice(0, 3);
  const isRent = l.offer_type === 'rent';
  const similarTitle = similarLocal.length >= 3 && city ? `Weitere Objekte in ${city}` : isRent ? 'Weitere Objekte zur Miete' : 'Weitere Objekte zum Kauf';
  const kit = l;
  return {
    l,
    team: s.team,
    hasArea: !!area,
    similar,
    similarTitle,
    title: listingTitle(kit, sameCity),
    jsonLd: listingJsonLd(kit, canonical(new URL(new URL(request.url).pathname, request.url))),
  };
}

export default function ListingPage({ loaderData: d }: Route.ComponentProps) {
  const { l, team } = d;
  const city = l.address.city;
  const sold = l.status === 'sold';
  const isRent = l.offer_type === 'rent';
  const agent = l.agent;
  const ref = listingRef(l);
  const type = propertyTypeLabel(l.property_type);
  const place = [l.address.postcode, city].filter(Boolean).join(' ');
  const searchHref = isRent ? '/mieten' : '/kaufen';
  const searchLabel = isRent ? 'Mieten' : sold ? 'Verkauft' : 'Kaufen';
  const rows: [string, string][] = [
    [t('offer'), sold ? 'Verkauft' : offerTypeLabel(l.offer_type)],
    [t('propertyType'), type],
    ...(!sold ? [[isRent ? 'Miete' : 'Preis', price(l)] as [string, string]] : []),
    ...(isRent && l.charges ? [['Nebenkosten', `${formatAmount(l.charges)} / Monat`] as [string, string]] : []),
    ...(l.rooms != null ? [['Zimmer', String(l.rooms)] as [string, string]] : []),
    ...(l.bedrooms != null ? [['Schlafzimmer', String(l.bedrooms)] as [string, string]] : []),
    ...(l.bathrooms != null ? [['Badezimmer', String(l.bathrooms)] as [string, string]] : []),
    ...(l.living_surface != null ? [[t('livingArea'), formatSurface(l.living_surface)] as [string, string]] : []),
    ...(l.land_surface != null ? [['Grundstück', formatSurface(l.land_surface)] as [string, string]] : []),
    ...(l.terrace_surface ? [['Terrasse', formatSurface(l.terrace_surface)] as [string, string]] : []),
    ...(l.balcony_surface ? [['Balkon', formatSurface(l.balcony_surface)] as [string, string]] : []),
    ...(l.floor != null ? [['Etage', l.floor === 0 ? 'Erdgeschoss' : `${l.floor}. Obergeschoss`] as [string, string]] : []),
    ...(l.construction_year ? [['Baujahr', String(l.construction_year)] as [string, string]] : []),
    [t('reference'), ref],
  ];
  const headline = [rooms(l.rooms), l.living_surface != null ? formatSurface(l.living_surface) : '', l.bedrooms != null ? `${l.bedrooms} Schlafzimmer` : ''].filter(Boolean);
  const message = sold ? `Guten Tag, ich suche ein ähnliches Objekt wie «${l.title}» (Ref. ${ref}).` : t('interested', { title: l.title, ref });
  const located = l.address.lat != null && l.address.lng != null;
  const mapsHref = located ? `https://www.openstreetmap.org/?mlat=${l.address.lat}&mlon=${l.address.lng}#map=15/${l.address.lat}/${l.address.lng}` : undefined;
  const sections = [
    l.description && ['beschreibung', 'Beschreibung'],
    ['eckdaten', 'Eckdaten'],
    l.energy_class && ['energie', 'Energie'],
    located && ['lage', 'Lage'],
  ].filter(Boolean) as [string, string][];
  const phone = agent?.phone ?? team.phone;
  return (
    <Layout
      title={`${d.title} | ${sold ? 'Verkauft' : price(l)}`}
      description={(l.description_text ?? l.title).replace(/\s+/g, ' ').slice(0, 155)}
      image={l.photos[0] && img(l.photos[0].url, { w: 1200, h: 630 })}
      jsonLd={d.jsonLd}
    >
      <nav className="crumbs wrap" aria-label="Brotkrumen">
        <ol>
          <li><a href={sold ? '/verkauft' : searchHref}>{searchLabel}</a></li>
          {city && <li>{d.hasArea ? <a href={areaUrl(city)}>{city}</a> : city}</li>}
          <li aria-current="page"><span className="muted">Ref. {ref}</span></li>
        </ol>
      </nav>

      <div className="wrap">
        <Gallery photos={l.photos} title={l.title} label={sold ? 'Verkauft' : undefined} />
        {l.photos.length === 0 && <div className="nophoto lp-nophoto caps">{type}</div>}
      </div>

      <div className="lp wrap">
        <article className="lp-main">
          <header className="lp-head">
            <p className="caps muted">{type}{place && ` · ${place}`}</p>
            <h1 className="h1">{l.title}</h1>
            {headline.length > 0 && <p className="lp-facts num">{headline.join(' · ')}</p>}
            <p className="lp-price num">{sold ? 'Verkauft' : price(l)}</p>
          </header>

          {l.description && (
            <section id="beschreibung" className="lp-sec" aria-labelledby="h-beschreibung">
              <h2 className="lp-h caps" id="h-beschreibung">Beschreibung</h2>
              <div className="prose lp-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(l.description) }} />
            </section>
          )}

          <section id="eckdaten" className="lp-sec" aria-labelledby="h-eckdaten">
            <h2 className="lp-h caps" id="h-eckdaten">Eckdaten</h2>
            <dl className="specs">
              {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="num">{v}</dd></div>)}
            </dl>
            {l.features.length > 0 && <ul className="feats">{l.features.map((f) => <li key={f}>{featureLabel(f)}</li>)}</ul>}
          </section>

          {l.energy_class && (
            <section id="energie" className="lp-sec" aria-labelledby="h-energie">
              <h2 className="lp-h caps" id="h-energie">Energie</h2>
              <EnergyScale value={l.energy_class} />
            </section>
          )}

          {located && (
            <section id="lage" className="lp-sec" aria-labelledby="h-lage">
              <h2 className="lp-h caps" id="h-lage">Lage</h2>
              <p className="lp-place">{place}{d.hasArea && <> · <a href={areaUrl(city!)}>Mehr über {city}</a></>}</p>
              <div className="lp-map"><ListingsMap listings={[l]} view={{ z: 14, lat: l.address.lat!, lng: l.address.lng! }} href={() => listingUrl(l)} price={() => (sold ? 'Verkauft' : price(l))} /></div>
              <p className="lp-note muted">Die Karte zeigt die ungefähre Lage. Die genaue Adresse erhalten Sie bei der Besichtigung. {mapsHref && <a href={mapsHref} rel="noopener" target="_blank">In OpenStreetMap öffnen</a>}</p>
            </section>
          )}
        </article>

        <aside className="lp-aside" aria-label="Auf einen Blick">
          <div className="kf">
            <p className="caps muted">{sold ? 'Verkauft' : offerTypeLabel(l.offer_type)}</p>
            <p className="kf-title">{l.title}</p>
            {place && <p className="kf-place muted">{place}</p>}
            <p className="kf-price num">{sold ? 'Verkauft' : price(l)}</p>
            {headline.length > 0 && <p className="kf-facts num muted">{headline.slice(0, 2).join(' · ')}</p>}
            <nav className="kf-nav" aria-label="Auf dieser Seite">
              {sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
            </nav>
            <a className="button button--solid kf-cta" href="#anfrage">{sold ? 'Ähnliches Objekt suchen' : 'Besichtigung anfragen'}</a>
            {agent && (
              <div className="kf-agent">
                {agent.photo && <div className="kf-agent-photo"><RaImage src={agent.photo.url} alt={fullName(agent)} width={144} height={180} sizes="72px" /></div>}
                <div>
                  <a href={agentUrl(agent)} className="kf-agent-name">{fullName(agent)}</a>
                  {agent.phone && <a href={telHref(agent.phone)} className="kf-agent-phone muted">{agent.phone}</a>}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <section id="anfrage" className="enq" aria-labelledby="h-anfrage">
        <div className="wrap enq-in">
          <div className="enq-agent">
            {agent ? (
              <>
                {agent.photo && <div className="enq-photo"><RaImage src={agent.photo.url} alt={fullName(agent)} width={480} height={600} sizes="240px" /></div>}
                <p className="enq-name"><a href={agentUrl(agent)}>{fullName(agent)}</a></p>
                {agent.title && <p className="caps muted">{agent.title}</p>}
                {agent.languages?.length ? <p className="muted">Spricht {languages(agent.languages)}</p> : null}
                <ul className="enq-contact">
                  {agent.phone && <li><a href={telHref(agent.phone)}>{agent.phone}</a></li>}
                  {agent.email && <li><a href={`mailto:${agent.email}`}>{agent.email}</a></li>}
                </ul>
              </>
            ) : (
              <ul className="enq-contact">
                {team.phone && <li><a href={telHref(team.phone)}>{team.phone}</a></li>}
                {team.email && <li><a href={`mailto:${team.email}`}>{team.email}</a></li>}
              </ul>
            )}
          </div>
          <div className="enq-form">
            <h2 className="h2" id="h-anfrage">{sold ? 'Ein ähnliches Objekt finden' : 'Anfrage zu diesem Objekt'}</h2>
            <p className="muted enq-lede">{sold
              ? 'Dieses Objekt ist verkauft. Beschreiben Sie, was Sie suchen: Wir melden uns, sobald ein passendes Objekt zu uns kommt.'
              : `${agent ? agent.first_name : 'Wir'} ${agent ? 'beantwortet' : 'beantworten'} Ihre Fragen und vereinbart gerne eine Besichtigung mit Ihnen.`}</p>
            {sold
              ? <EnquiryForm contactReason="buy" agentId={agent?.id} agentName={agent?.first_name} message={message} submitLabel="Suchauftrag senden" />
              : <EnquiryForm listingId={l.id} agentId={agent?.id} agentName={agent?.first_name} message={message} />}
          </div>
        </div>
      </section>

      <Collection id="c-similar" label={isRent ? 'Zur Miete' : 'Zum Kauf'} title={d.similarTitle} listings={d.similar} href={searchHref} linkLabel="Alle ansehen" />

      {!sold && (
        <div className="mbar" aria-label="Schnellkontakt">
          <span className="mbar-price num">{price(l)}</span>
          {phone && <a className="button mbar-call" href={telHref(phone)}>Anrufen</a>}
          <a className="button button--solid mbar-cta" href="#anfrage">Anfragen</a>
        </div>
      )}
    </Layout>
  );
}
