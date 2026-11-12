/**
 * Listing page. Gallery (1 + 4, a strip on phones), sticky section tabs
 * (aperçu, caractéristiques, quartier, contact), fact tiles, an indicative
 * monthly payment for sales, DPE, the area, and the enquiry form with the
 * listing's agent. On desktop a sticky card keeps price and agent in view;
 * on phones a bottom bar keeps "Appeler" and "Écrire" in reach.
 * Behaviour: tabs(), gallery(), payment() and saved() in app/client.ts.
 */
import type { Route } from './+types/annonces-slug';
import { listingIdFromSlug, sanitizeHtml } from '@realadvisor/sites-kit';
import { img } from '@realadvisor/sites-kit/image';
import { featureLabel } from '@realadvisor/sites-kit/i18n';
import { listingJsonLd, listingRef, listingTitle } from '@realadvisor/sites-kit/seo';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { ListingsMap } from '@realadvisor/sites-kit-react/components/ListingsMap';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { canonical } from '@realadvisor/sites-kit-react/server/kit';
import { RaImage } from '../components/RaImage';
import { Layout } from '../components/Layout';
import { Gallery } from '../components/Gallery';
import { Icon, type IconName } from '../components/Icon';
import { ListingCard } from '../components/ListingCard';
import { SaveButton } from '../components/SaveButton';
import { AgentBlock } from '../components/AgentBlock';
import { EnergyScale } from '../components/EnergyScale';
import { PaymentEstimate } from '../components/PaymentEstimate';
import { siteData, sites } from '../lib/data.server';
import {
  agentName, bathrooms, bedrooms, cityHref, cityLine, citySlug, floor, hasPrice, listingHref, price, R, rooms,
  searchUrl, surface, teamHref, teamShortName, tel, typeLabel, date,
} from '../lib/site';
import { placeFor } from '../content/places';
import { CITY_TEXT } from '../content/cities';
import './annonces-slug.css';

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug;
  const l = await sites.listing(slug);
  // A slug ending in a listing id was ours (sold, removed): 410 Gone with "no longer available".
  if (!l) throw notFound(!!listingIdFromSlug(slug));
  const [{ teams, agents }, sameCity] = await Promise.all([
    siteData(),
    l.address.city ? sites.allListings({ city: l.address.city }) : Promise.resolve([]),
  ]);
  const kit = l;
  const agent = l.agent ? agents.find((a) => a.id === l.agent!.id) ?? l.agent : undefined;
  const team = teams.find((t) => l.team_ids.includes(t.id) || agent?.team_ids.includes(t.id));
  return {
    l,
    agent,
    team,
    ref: listingRef(kit),
    x: {
      energy: l.energy_class,
      yearBuilt: l.construction_year,
      level: l.floor,
      balcony: l.balcony_surface,
      terrace: l.terrace_surface,
      charges: l.charges,
    },
    nearby: sameCity
      .filter((x) => x.id !== l.id && x.status === 'available')
      .sort((a, b) => (a.offer_type === l.offer_type ? -1 : 1) - (b.offer_type === l.offer_type ? -1 : 1))
      .slice(0, 3),
    title: `${listingTitle(kit, sameCity)} | ${price(l)}`,
    jsonLd: listingJsonLd(kit, canonical(new URL(new URL(request.url).pathname, request.url))),
  };
}

const TABS = [
  ['apercu', 'Aperçu'],
  ['caracteristiques', 'Caractéristiques'],
  ['quartier', 'Quartier'],
  ['contact', 'Contact'],
];

export default function ListingPage({ loaderData: d }: Route.ComponentProps) {
  const { l, agent, team, ref, nearby } = d;
  const { energy, yearBuilt, level, balcony, terrace, charges } = d.x;
  const sold = l.status === 'sold';
  const typ = typeLabel(l.property_type);
  const place = cityLine(l);
  const tiles = [
    { icon: 'home', label: 'Type', value: typ },
    l.living_surface && { icon: 'area', label: 'Surface habitable', value: surface(l.living_surface) },
    l.rooms && { icon: 'door', label: 'Pièces', value: rooms(l.rooms) },
    l.bedrooms && { icon: 'bed', label: 'Chambres', value: bedrooms(l.bedrooms) },
    l.bathrooms && { icon: 'bath', label: 'Salles de bains', value: bathrooms(l.bathrooms) },
    level != null && { icon: 'stairs', label: 'Étage', value: floor(level) },
    l.land_surface && { icon: 'tree', label: 'Terrain', value: surface(l.land_surface) },
    (terrace || balcony) && { icon: 'sun', label: terrace ? 'Terrasse' : 'Balcon', value: surface(terrace ?? balcony) },
    yearBuilt && { icon: 'calendar', label: 'Construction', value: String(yearBuilt) },
  ].filter(Boolean) as { icon: IconName; label: string; value: string }[];
  const specs = [
    ['Référence', ref],
    ['Type de bien', typ],
    ['Offre', l.offer_type === 'rent' ? 'Location' : 'Vente'],
    ['Prix', price(l)],
    l.offer_type === 'rent' && charges != null && ['Charges', `${charges} € / mois`],
    l.living_surface && ['Surface habitable', surface(l.living_surface)],
    l.land_surface && ['Terrain', surface(l.land_surface)],
    terrace && ['Terrasse', surface(terrace)],
    balcony && ['Balcon', surface(balcony)],
    l.rooms && ['Pièces', String(l.rooms)],
    l.bedrooms && ['Chambres', String(l.bedrooms)],
    l.bathrooms && ['Salles de bains', String(l.bathrooms)],
    level != null && ['Étage', floor(level)],
    yearBuilt && ['Année de construction', String(yearBuilt)],
    ['Adresse', [l.address.street, place].filter(Boolean).join(', ')],
    ['Publiée', date(l.published_at)],
  ].filter(Boolean) as [string, string][];
  const cityKey = l.address.city ? citySlug(l.address.city) : '';
  const areaPhoto = placeFor(cityKey)[0];
  const areaText = CITY_TEXT[cityKey];
  const hasMap = l.address.lat != null && l.address.lng != null;
  const descr = (l.description_text ?? '').replace(/\s+/g, ' ').trim();
  const first = l.photos[0];
  const agentFirst = agent?.first_name;
  const enquiryMsg = `Bonjour, je suis intéressé(e) par « ${l.title} » (réf. ${ref}). Pouvez-vous me recontacter ?`;
  const back = sold ? R.sold : searchUrl(l.offer_type, { city: l.address.city });
  const phone = agent?.phone ?? team?.phone;
  const photo = agent && 'photo' in agent ? agent.photo : undefined;
  return (
    <Layout nav={sold ? 'none' : l.offer_type} stickyBar={!sold} title={d.title}
      description={descr.slice(0, 155) || `${l.title}, ${place}`}
      image={first && img(first.url, { w: 1200, h: 630 })}
      jsonLd={d.jsonLd} noindex={sold}>

      <div className="wrap lp-top">
        <a className="lp-back" href={back}><Icon name="back" size={18} />{sold ? 'Biens vendus' : l.address.city ? `${l.offer_type === 'rent' ? 'Locations' : 'Ventes'} à ${l.address.city}` : 'Toutes les annonces'}</a>
        {!sold && (
          <SaveButton variant="label" id={l.id} href={listingHref(l)} title={l.title} price={price(l)} place={place}
            facts={[rooms(l.rooms), surface(l.living_surface)].filter(Boolean).join(' · ')} img={first ? img(first.url, { w: 320, h: 240 }) : ''} alt={first?.alt ?? ''} />
        )}
      </div>

      <div className="wrap">
        <Gallery photos={l.photos} label={l.title} noPhotoText={`${typ}, photos à venir`} />
      </div>

      <nav className="tabs" aria-label="Sections de l'annonce" data-tabs="">
        <div className="wrap tabs__in">
          <ul>
            {TABS.map(([id, label]) => <li key={id}><a href={`#${id}`} data-tab={id}>{label}</a></li>)}
          </ul>
          <p className="tabs__price num">{price(l)}</p>
        </div>
      </nav>

      <div className="wrap lp">
        <div className="lp__main">
          <section id="apercu" className="lp__sec lp__intro" aria-labelledby="lp-h1">
            {sold && <p className="lp__sold">{l.offer_type === 'rent' ? 'Ce bien est loué.' : 'Ce bien a été vendu par notre agence.'}</p>}
            <p className="lp__price num">{price(l)}</p>
            <h1 id="lp-h1" className="lp__h1">{l.title}</h1>
            <p className="lp__where"><Icon name="pin" size={18} />{[l.address.street, place].filter(Boolean).join(', ')}</p>

            <ul className="tiles">
              {tiles.map((x) => (
                <li key={x.label} className="tile"><Icon name={x.icon} size={22} /><span className="tile__v">{x.value}</span><span className="tile__l">{x.label}</span></li>
              ))}
            </ul>

            {l.description && <div className="prose lp__desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(l.description) }} />}

            {l.features.length > 0 && (
              <div className="lp__feat">
                <h2 className="lp__h2">Équipements</h2>
                <ul className="feat">{l.features.map((f) => <li key={f}>{featureLabel(f, 'fr-FR')}</li>)}</ul>
              </div>
            )}

            {!sold && l.offer_type === 'buy' && hasPrice(l) && <PaymentEstimate price={l.price!} />}
          </section>

          <section id="caracteristiques" className="lp__sec" aria-labelledby="spec-h">
            <h2 id="spec-h" className="lp__h2">Caractéristiques</h2>
            <dl className="specs">
              {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            {energy && <EnergyScale grade={energy} />}
          </section>

          <section id="quartier" className="lp__sec" aria-labelledby="area-h">
            <h2 id="area-h" className="lp__h2">Le quartier{l.address.city && <> : {l.address.city}</>}</h2>
            {areaText && <p className="lp__area-lede">{areaText.lede}</p>}
            {hasMap && (
              <div className="lp__map">
                <ListingsMap listings={[l]} href={() => listingHref(l)} price={() => price(l)} />
                <p className="lp__map-note muted">Emplacement approximatif. L'adresse exacte est communiquée lors de la visite.</p>
              </div>
            )}
            {!hasMap && areaPhoto && (
              <RaImage className="lp__area-photo" src={areaPhoto} alt={areaPhoto.alt ?? ''} width={1200} height={600} sizes="(min-width: 960px) 760px, 100vw" />
            )}
            {l.address.city && <p><a className="link" href={cityHref(l.address.city)}>Tout savoir sur nos biens à {l.address.city}</a></p>}
          </section>

          <section id="contact" className="lp__sec lp__contact" aria-labelledby="contact-h">
            <h2 id="contact-h" className="lp__h2">{sold ? 'Un bien similaire à vendre ?' : agentFirst ? `Écrire à ${agentFirst}` : 'Nous écrire'}</h2>
            {agent && <AgentBlock agent={agent} team={team} layout="row" as="p" />}
            {sold ? (
              <EnquiryForm contactReason="valuation" message={`Bonjour, je possède un bien comparable à « ${l.title} » (réf. ${ref}) et souhaite une estimation.`} submitLabel="Demander une estimation" />
            ) : (
              <EnquiryForm listingId={l.id} agentId={agent?.id} agentName={agentFirst} message={enquiryMsg} submitLabel="Envoyer ma demande" />
            )}
            <p className="lp__ref muted">Réf. {ref}</p>
          </section>
        </div>

        <aside className="lp__aside" aria-label="Résumé et contact">
          <div className="side">
            <p className="side__price num">{price(l)}</p>
            <p className="side__facts">{[rooms(l.rooms), bedrooms(l.bedrooms), surface(l.living_surface)].filter(Boolean).join(' · ')}</p>
            {!sold && l.offer_type === 'buy' && hasPrice(l) && <a className="side__pay" href="#pay">Voir la mensualité estimée</a>}
            {agent && (
              <div className="side__agent">
                {photo && <RaImage className="side__photo" src={photo} alt={photo.alt || agentName(agent)} width={128} height={160} sizes="64px" />}
                <div>
                  <p className="side__name">{agentName(agent)}</p>
                  {team && <p className="side__team"><a href={teamHref(team)}>Vellane {teamShortName(team)}</a></p>}
                </div>
              </div>
            )}
            <a className="vb side__btn" href="#contact">{sold ? 'Demander une estimation' : 'Écrire à l’agent'}</a>
            {phone && <a className="vb vb--ghost side__btn" href={tel(phone)}><Icon name="phone" size={18} />{phone}</a>}
          </div>
        </aside>
      </div>

      {nearby.length > 0 && (
        <section className="wrap near" aria-labelledby="near-h">
          <h2 id="near-h" className="lp__h2">Autres biens à {l.address.city}</h2>
          <ul className="cards">{nearby.map((x) => <li key={x.id}><ListingCard listing={x} /></li>)}</ul>
        </section>
      )}

      {!sold && (
        <div className="bar" aria-label="Contacter l'agence">
          {phone && <a className="vb vb--ghost" href={tel(phone)}><Icon name="phone" size={18} />Appeler</a>}
          <a className="vb" href="#contact"><Icon name="mail" size={18} />Écrire</a>
        </div>
      )}
    </Layout>
  );
}
