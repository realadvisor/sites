/**
 * The site's own UI words in French and German. Kit parts (form, legal,
 * consent, search) bring theirs. `{name}` placeholders are filled by tx().
 */
import type { L } from './routes';

const T = {
  // navigation
  navBuy: { fr: 'Acheter', de: 'Kaufen' },
  navRent: { fr: 'Louer', de: 'Mieten' },
  navNew: { fr: 'Neuf', de: 'Neubau' },
  navSell: { fr: 'Vendre', de: 'Verkaufen' },
  navOffices: { fr: 'Bureaux', de: 'Standorte' },
  navTeam: { fr: 'Équipe', de: 'Team' },
  navAbout: { fr: 'À propos', de: 'Über uns' },
  navContact: { fr: 'Contact', de: 'Kontakt' },
  navSold: { fr: 'Biens vendus', de: 'Verkaufte Objekte' },
  navAreas: { fr: 'Régions', de: 'Regionen' },
  menu: { fr: 'Menu', de: 'Menü' },
  closeMenu: { fr: 'Fermer le menu', de: 'Menü schliessen' },
  mainNav: { fr: 'Navigation principale', de: 'Hauptnavigation' },
  skip: { fr: 'Aller au contenu', de: 'Zum Inhalt springen' },
  language: { fr: 'Langue', de: 'Sprache' },
  breadcrumb: { fr: 'Fil d’Ariane', de: 'Brotkrumen' },
  home: { fr: 'Accueil', de: 'Startseite' },
  valuationCta: { fr: 'Estimer mon bien', de: 'Immobilie bewerten' },

  // home
  homeEyebrow: { fr: 'Immobilier résidentiel', de: 'Wohnimmobilien' },
  homeTitle: { fr: 'Appartements et maisons entre {from} et {to}', de: 'Wohnungen und Häuser zwischen {from} und {to}' },
  homeTitle1: { fr: 'Appartements et maisons à {city}', de: 'Wohnungen und Häuser in {city}' },
  homeLede: {
    fr: 'À vendre et à louer chez nos bureaux de {cities}. Cherchez par localité, type et budget.',
    de: 'Zum Kauf und zur Miete bei unseren Standorten {cities}. Suchen Sie nach Ort, Objektart und Budget.',
  },
  searchIntent: { fr: 'Je souhaite', de: 'Ich möchte' },
  tabBuy: { fr: 'Acheter', de: 'Kaufen' },
  tabRent: { fr: 'Louer', de: 'Mieten' },
  tabNew: { fr: 'Neuf', de: 'Neubau' },
  tabSell: { fr: 'Vendre', de: 'Verkaufen' },
  where: { fr: 'Localité', de: 'Ort' },
  allPlaces: { fr: 'Toutes les localités', de: 'Alle Orte' },
  type: { fr: 'Type de bien', de: 'Objektart' },
  allTypes: { fr: 'Tous les types', de: 'Alle Objektarten' },
  budget: { fr: 'Budget maximum', de: 'Budget bis' },
  anyBudget: { fr: 'Sans limite', de: 'Ohne Limite' },
  searchN: { fr: 'Voir les {n} biens', de: '{n} Objekte ansehen' },
  newPanel: {
    fr: '{n} programme neuf, {units} appartements disponibles.',
    de: '{n} Neubauprojekt, {units} Wohnungen verfügbar.',
  },
  newPanelPlural: {
    fr: '{n} programmes neufs, {units} appartements disponibles.',
    de: '{n} Neubauprojekte, {units} Wohnungen verfügbar.',
  },
  seeDevelopments: { fr: 'Voir les programmes', de: 'Projekte ansehen' },
  sellPanel: {
    fr: 'Une estimation gratuite par le bureau de votre région, avec visite du bien.',
    de: 'Eine kostenlose Bewertung durch den Standort Ihrer Region, mit Besichtigung.',
  },
  featuredTitle: { fr: 'Nouveaux sur le marché', de: 'Neu auf dem Markt' },
  seeAllBuy: { fr: 'Tous les biens à vendre', de: 'Alle Objekte zum Kauf' },
  seeAllRent: { fr: 'Tous les biens à louer', de: 'Alle Mietobjekte' },
  officesTitleN: { fr: 'Nos bureaux à {cities}', de: 'Unsere Standorte in {cities}' },
  officesNote: {
    fr: 'Chaque bien est suivi par le bureau le plus proche. Le numéro ci-contre vous met directement en relation avec son équipe.',
    de: 'Jedes Objekt wird vom nächstgelegenen Standort betreut. Unter der jeweiligen Nummer erreichen Sie direkt das Team vor Ort.',
  },
  visitOffice: { fr: 'Le bureau', de: 'Zum Standort' },
  newBuild: { fr: 'Programme neuf', de: 'Neubauprojekt' },
  discover: { fr: 'Découvrir le programme', de: 'Projekt entdecken' },
  areasTitle: { fr: 'Les localités où nous avons des biens', de: 'Orte mit aktuellen Angeboten' },
  homesIn: { fr: 'Immobilier à {city}', de: 'Immobilien in {city}' },
  valuationTitle: { fr: 'Que vaut votre bien aujourd’hui ?', de: 'Was ist Ihre Immobilie heute wert?' },
  valuationText: {
    fr: 'Un conseiller du bureau le plus proche visite le bien et vous remet une estimation écrite, basée sur les ventes du quartier. C’est gratuit.',
    de: 'Eine Beraterin oder ein Berater des nächsten Standorts besichtigt die Immobilie und erstellt eine schriftliche Bewertung auf Basis der Verkäufe im Quartier. Kostenlos.',
  },
  seeSold: { fr: 'Toutes nos ventes', de: 'Alle Verkäufe' },
  seeSoldN: { fr: 'Nos {n} dernières ventes', de: 'Unsere {n} letzten Verkäufe' },

  // listing cards and pages
  sold: { fr: 'Vendu', de: 'Verkauft' },
  forSale: { fr: 'À vendre', de: 'Zu verkaufen' },
  forRent: { fr: 'À louer', de: 'Zu vermieten' },
  reserved: { fr: 'Réservé', de: 'Reserviert' },
  available: { fr: 'Disponible', de: 'Verfügbar' },
  noPhoto: { fr: 'Photo à venir', de: 'Foto folgt' },
  photo: { fr: 'photo {n}', de: 'Foto {n}' },
  allPhotos: { fr: 'Voir les {n} photos', de: 'Alle {n} Fotos' },
  photos: { fr: 'Photos', de: 'Fotos' },
  facts: { fr: 'En bref', de: 'Auf einen Blick' },
  description: { fr: 'Description', de: 'Beschreibung' },
  features: { fr: 'Équipements', de: 'Ausstattung' },
  location: { fr: 'Situation', de: 'Lage' },
  price: { fr: 'Prix', de: 'Preis' },
  rent: { fr: 'Loyer', de: 'Miete' },
  charges: { fr: 'Charges', de: 'Nebenkosten' },
  perMonth: { fr: '/ mois', de: '/ Monat' },
  rooms: { fr: 'Pièces', de: 'Zimmer' },
  bedrooms: { fr: 'Chambres', de: 'Schlafzimmer' },
  bathrooms: { fr: 'Salles d’eau', de: 'Badezimmer' },
  livingArea: { fr: 'Surface habitable', de: 'Wohnfläche' },
  landArea: { fr: 'Terrain', de: 'Grundstück' },
  terrace: { fr: 'Terrasse', de: 'Terrasse' },
  balcony: { fr: 'Balcon', de: 'Balkon' },
  garden: { fr: 'Jardin', de: 'Garten' },
  floor: { fr: 'Étage', de: 'Etage' },
  yearBuilt: { fr: 'Année de construction', de: 'Baujahr' },
  energy: { fr: 'Étiquette énergétique', de: 'Energieeffizienz (GEAK)' },
  energyClass: { fr: 'Classe {c}', de: 'Klasse {c}' },
  reference: { fr: 'Réf.', de: 'Ref.' },
  propertyType: { fr: 'Type', de: 'Objektart' },
  address: { fr: 'Adresse', de: 'Adresse' },
  approxLocation: { fr: 'Emplacement approximatif', de: 'Ungefähre Lage' },
  openMap: { fr: 'Ouvrir dans OpenStreetMap', de: 'In OpenStreetMap öffnen' },
  yourAdvisor: { fr: 'Votre conseiller', de: 'Ihre Ansprechperson' },
  askAbout: { fr: 'Demander une visite', de: 'Besichtigung anfragen' },
  call: { fr: 'Appeler', de: 'Anrufen' },
  write: { fr: 'Écrire', de: 'Schreiben' },
  message: { fr: 'Message', de: 'Nachricht' },
  similar: { fr: 'Dans la même région', de: 'In derselben Region' },
  officeOf: { fr: 'Bureau de {city}', de: 'Standort {city}' },
  listedBy: { fr: 'Présenté par le bureau de {city}', de: 'Angeboten vom Standort {city}' },

  // search pages
  buyTitle: { fr: 'Biens à vendre', de: 'Immobilien zum Kauf' },
  rentTitle: { fr: 'Biens à louer', de: 'Immobilien zur Miete' },
  inCity: { fr: 'à {city}', de: 'in {city}' },
  searchLede: {
    fr: 'Appartements et maisons de nos bureaux de {cities}.',
    de: 'Wohnungen und Häuser unserer Standorte {cities}.',
  },
  page: { fr: 'Page', de: 'Seite' },
  mapView: { fr: 'Carte', de: 'Karte' },

  // sell
  sellTitle: { fr: 'Estimer et vendre votre bien', de: 'Ihre Immobilie bewerten und verkaufen' },
  sellLede: {
    fr: 'Dites-nous où se trouve votre bien. Le bureau de votre région vous rappelle pour convenir d’une visite.',
    de: 'Sagen Sie uns, wo Ihre Immobilie liegt. Der Standort Ihrer Region ruft Sie für einen Besichtigungstermin zurück.',
  },
  valuationForm: { fr: 'Demande d’estimation', de: 'Bewertungsanfrage' },
  valuationMessage: {
    fr: 'Bonjour, je souhaite faire estimer mon bien. Adresse : … Type : … Surface : …',
    de: 'Guten Tag, ich möchte meine Immobilie bewerten lassen. Adresse: … Objektart: … Fläche: …',
  },
  sendValuation: { fr: 'Demander une estimation', de: 'Bewertung anfragen' },
  howWeSell: { fr: 'Comment nous vendons', de: 'So verkaufen wir' },
  ourSales: { fr: 'Nos dernières ventes', de: 'Unsere letzten Verkäufe' },
  soldByUs: { fr: '{n} biens vendus par nos bureaux', de: '{n} verkaufte Objekte unserer Standorte' },

  // team, agents
  teamTitle: { fr: 'Nos conseillers', de: 'Unsere Beraterinnen und Berater' },
  teamLede: {
    fr: '{n} conseillers dans {offices} bureaux, avec leur ligne directe et les langues qu’ils parlent.',
    de: '{n} Beraterinnen und Berater an {offices} Standorten, mit Direktnummer und Sprachen.',
  },
  languages: { fr: 'Langues', de: 'Sprachen' },
  speaks: { fr: 'Parle {langs}', de: 'Spricht {langs}' },
  profile: { fr: 'Voir le profil', de: 'Profil ansehen' },
  agentListings: { fr: 'Biens présentés par {name}', de: 'Objekte von {name}' },
  agentSold: { fr: 'Ventes récentes', de: 'Letzte Verkäufe' },
  contactAgent: { fr: 'Contacter {name}', de: '{name} kontaktieren' },
  agentMessage: { fr: 'Bonjour {name}, ', de: 'Guten Tag {name}, ' },
  noAgentListings: {
    fr: 'Aucun bien en ligne pour le moment. {name} vous renseigne volontiers sur les biens à venir.',
    de: 'Zurzeit keine Objekte online. {name} informiert Sie gerne über kommende Angebote.',
  },

  // offices
  officesPageTitle: { fr: 'Nos bureaux', de: 'Unsere Standorte' },
  officesLede: {
    fr: 'Adresses, téléphones et équipes. Le bureau le plus proche du bien s’occupe de la vente ou de la location.',
    de: 'Adressen, Telefonnummern und Teams. Der Standort, der dem Objekt am nächsten liegt, betreut Verkauf oder Vermietung.',
  },
  team: { fr: 'L’équipe', de: 'Das Team' },
  officeListings: { fr: 'Biens du bureau', de: 'Objekte des Standorts' },
  officeContact: { fr: 'Écrire au bureau', de: 'Dem Standort schreiben' },
  officeMessage: { fr: 'Bonjour, je souhaite être contacté(e) par le bureau de {city}.', de: 'Guten Tag, ich möchte vom Standort {city} kontaktiert werden.' },
  nAgents: { fr: '{n} conseillers', de: '{n} Beraterinnen und Berater' },
  nAgent1: { fr: '1 conseiller', de: '1 Ansprechperson' },
  nListings: { fr: '{n} biens', de: '{n} Objekte' },
  nListing1: { fr: '1 bien', de: '1 Objekt' },
  directions: { fr: 'Itinéraire', de: 'Route' },

  // areas
  areasPageTitle: { fr: 'Nos régions', de: 'Unsere Regionen' },
  areasLede: {
    fr: 'Les biens à vendre et à louer par localité, avec le bureau qui s’en occupe.',
    de: 'Kauf- und Mietobjekte nach Ort, mit dem zuständigen Standort.',
  },
  areaForSale: { fr: 'À vendre', de: 'Zum Kauf' },
  areaForRent: { fr: 'À louer', de: 'Zur Miete' },
  areaPriceRange: { fr: 'Prix de vente', de: 'Kaufpreise' },
  areaSurfaces: { fr: 'Surfaces', de: 'Flächen' },
  areaAvailable: { fr: 'Biens disponibles à {city}', de: 'Verfügbare Objekte in {city}' },
  areaSold: { fr: 'Vendus à {city}', de: 'Verkauft in {city}' },
  nearestOffice: { fr: 'Votre bureau pour {city}', de: 'Ihr Standort für {city}' },
  areaNone: {
    fr: 'Aucun bien disponible à {city} en ce moment. Le bureau de {office} vous informe dès qu’un bien entre sur le marché.',
    de: 'Zurzeit kein verfügbares Objekt in {city}. Der Standort {office} informiert Sie, sobald ein Objekt auf den Markt kommt.',
  },

  // developments
  devTitle: { fr: 'Programmes neufs', de: 'Neubauprojekte' },
  devLede: {
    fr: 'Appartements neufs vendus sur plan : prix, plans et disponibilités lot par lot.',
    de: 'Neubauwohnungen ab Plan: Preise, Grundrisse und Verfügbarkeit pro Einheit.',
  },
  delivery: { fr: 'Livraison', de: 'Bezug' },
  status: { fr: 'Statut', de: 'Status' },
  units: { fr: 'Lots', de: 'Einheiten' },
  unit: { fr: 'Lot', de: 'Einheit' },
  unitsAvailable: { fr: '{n} disponibles sur {t}', de: '{n} von {t} verfügbar' },
  priceFrom: { fr: 'dès {p}', de: 'ab {p}' },
  developer: { fr: 'Maître d’ouvrage', de: 'Bauherrschaft' },
  architect: { fr: 'Architecte', de: 'Architektur' },
  contractor: { fr: 'Entreprise générale', de: 'Generalunternehmung' },
  credits: { fr: 'Intervenants', de: 'Beteiligte' },
  availability: { fr: 'Disponibilités', de: 'Verfügbarkeit' },
  availabilityLede: {
    fr: 'Un bloc par lot, sa largeur suit la surface. Cliquez sur un lot pour son plan et son prix.',
    de: 'Ein Block pro Einheit, die Breite folgt der Fläche. Klicken Sie auf eine Einheit für Grundriss und Preis.',
  },
  onlyAvailable: { fr: 'Seulement les lots disponibles', de: 'Nur verfügbare Einheiten' },
  unitTypes: { fr: 'Typologies', de: 'Wohnungstypen' },
  plan: { fr: 'Plan', de: 'Grundriss' },
  planIndicative: { fr: 'Plan indicatif, non contractuel', de: 'Grundriss unverbindlich, nur zur Orientierung' },
  planOf: { fr: 'Plan indicatif du lot {u}', de: 'Unverbindlicher Grundriss der Einheit {u}' },
  typeName: { fr: 'Type {k}', de: 'Typ {k}' },
  orientation: { fr: 'Orientation', de: 'Ausrichtung' },
  outdoor: { fr: 'Extérieur', de: 'Aussenfläche' },
  seeUnit: { fr: 'Voir le lot', de: 'Einheit ansehen' },
  askUnit: { fr: 'Demander ce lot', de: 'Diese Einheit anfragen' },
  devContact: { fr: 'Recevoir la documentation', de: 'Unterlagen anfordern' },
  documents: { fr: 'Documents', de: 'Dokumente' },
  brochure: { fr: 'Brochure du programme', de: 'Projektbroschüre' },
  priceList: { fr: 'Liste de prix', de: 'Preisliste' },
  pdf: { fr: 'PDF', de: 'PDF' },
  otherUnits: { fr: 'Autres lots du même type', de: 'Weitere Einheiten dieses Typs' },
  backToDev: { fr: 'Retour au programme', de: 'Zurück zum Projekt' },
  unitSoldNote: { fr: 'Ce lot est vendu. D’autres lots du programme sont encore disponibles.', de: 'Diese Einheit ist verkauft. Weitere Einheiten des Projekts sind noch verfügbar.' },
  unitReservedNote: { fr: 'Ce lot est réservé. Laissez-nous vos coordonnées si la réservation est levée.', de: 'Diese Einheit ist reserviert. Hinterlassen Sie Ihre Kontaktdaten, falls die Reservation aufgehoben wird.' },
  floorRow: { fr: 'Étage', de: 'Geschoss' },
  table: { fr: 'Tableau des lots', de: 'Übersicht der Einheiten' },
  legendAvailable: { fr: 'Disponible', de: 'Verfügbar' },

  // sold
  soldTitle: { fr: 'Biens vendus', de: 'Verkaufte Objekte' },
  soldLede: {
    fr: 'Une sélection des biens vendus par nos bureaux. Les prix de vente restent confidentiels.',
    de: 'Eine Auswahl der von unseren Standorten verkauften Objekte. Die Verkaufspreise bleiben vertraulich.',
  },
  soldCta: { fr: 'Vous envisagez de vendre ?', de: 'Sie denken an einen Verkauf?' },

  // about
  aboutLede: {
    fr: '{name} a des bureaux à {cities}.',
    de: '{name} hat Standorte in {cities}.',
  },

  // contact
  contactTitle: { fr: 'Nous contacter', de: 'Kontakt' },
  contactLede: {
    fr: 'Écrivez-nous ou appelez directement le bureau de votre région. Votre message est transmis au bon interlocuteur.',
    de: 'Schreiben Sie uns oder rufen Sie den Standort Ihrer Region direkt an. Ihre Nachricht geht an die richtige Ansprechperson.',
  },
  writeUs: { fr: 'Écrivez-nous', de: 'Schreiben Sie uns' },
  phone: { fr: 'Téléphone', de: 'Telefon' },
  email: { fr: 'E-mail', de: 'E-Mail' },

  // footer
  footerLine: {
    fr: 'Agence immobilière à {cities}.',
    de: 'Immobilienagentur in {cities}.',
  },
  explore: { fr: 'Explorer', de: 'Entdecken' },
  company: { fr: 'Société', de: 'Unternehmen' },
  rights: { fr: 'Tous droits réservés.', de: 'Alle Rechte vorbehalten.' },

  // 404
  notFoundEyebrow: { fr: 'Erreur 404', de: 'Fehler 404' },
} satisfies Record<string, Record<L, string>>;

export type Key = keyof typeof T;

export const tx =
  (l: L) =>
  (key: Key, vars: Record<string, string | number> = {}) =>
    T[key][l].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));

/** "Genève, Lausanne et Zurich" / "Genf, Lausanne und Zürich". */
export const joinList = (items: string[], l: L) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} ${l === 'de' ? 'und' : 'et'} ${items.at(-1)}`;

/** City names in the page language (data keeps the local name). */
const CITY: Record<string, { fr: string; de: string }> = {
  'Genève': { fr: 'Genève', de: 'Genf' },
  'Zürich': { fr: 'Zurich', de: 'Zürich' },
};
export const cityName = (city: string | undefined, l: L) => (city ? (CITY[city]?.[l] ?? city) : '');

const LANG_NAMES: Record<string, { fr: string; de: string }> = {
  fr: { fr: 'français', de: 'Französisch' },
  de: { fr: 'allemand', de: 'Deutsch' },
  en: { fr: 'anglais', de: 'Englisch' },
  it: { fr: 'italien', de: 'Italienisch' },
  es: { fr: 'espagnol', de: 'Spanisch' },
  pt: { fr: 'portugais', de: 'Portugiesisch' },
};
export const langName = (code: string, l: L) => LANG_NAMES[code]?.[l] ?? code.toUpperCase();
