/**
 * The site's own UI words in German, French and English. Kit parts (form,
 * legal, consent, search) bring theirs. `{name}` placeholders are filled by tx().
 * Sie / vous / you throughout.
 */
import type { L } from './routes';

const T = {
  // navigation and frame
  navBuy: { de: 'Kaufen', fr: 'Acheter', en: 'Buy' },
  navRent: { de: 'Mieten', fr: 'Louer', en: 'Rent' },
  navNew: { de: 'Neubau', fr: 'Neuf', en: 'New homes' },
  navSell: { de: 'Verkaufen', fr: 'Vendre', en: 'Sell' },
  navOffices: { de: 'Standorte', fr: 'Bureaux', en: 'Offices' },
  navTeam: { de: 'Team', fr: 'Équipe', en: 'Team' },
  navAbout: { de: 'Über uns', fr: 'À propos', en: 'About us' },
  navContact: { de: 'Kontakt', fr: 'Contact', en: 'Contact' },
  navSold: { de: 'Verkaufte Objekte', fr: 'Biens vendus', en: 'Sold properties' },
  navAreas: { de: 'Regionen', fr: 'Régions', en: 'Regions' },
  menu: { de: 'Menü', fr: 'Menu', en: 'Menu' },
  closeMenu: { de: 'Menü schliessen', fr: 'Fermer le menu', en: 'Close menu' },
  mainNav: { de: 'Hauptnavigation', fr: 'Navigation principale', en: 'Main navigation' },
  skip: { de: 'Zum Inhalt springen', fr: 'Aller au contenu', en: 'Skip to content' },
  language: { de: 'Sprache', fr: 'Langue', en: 'Language' },
  breadcrumb: { de: 'Brotkrumen', fr: 'Fil d’Ariane', en: 'Breadcrumb' },
  home: { de: 'Startseite', fr: 'Accueil', en: 'Home' },
  valuationCta: { de: 'Immobilie bewerten', fr: 'Estimer mon bien', en: 'Value my property' },
  explore: { de: 'Angebot', fr: 'Offre', en: 'Properties' },
  company: { de: 'Unternehmen', fr: 'Entreprise', en: 'Company' },

  // home
  homeTitle: { de: 'Wohnungen und Häuser in {cities}', fr: 'Appartements et maisons à {cities}', en: 'Flats and houses in {cities}' },
  homeLede: {
    de: 'Kauf, Miete und Verkauf von Wohneigentum, betreut von unseren Teams in {cities}.',
    fr: 'Achat, location et vente de logements, suivis par nos équipes de {cities}.',
    en: 'Buying, renting and selling homes, handled by our teams in {cities}.',
  },
  searchIntent: { de: 'Angebot', fr: 'Offre', en: 'Offer' },
  where: { de: 'Ort', fr: 'Localité', en: 'Location' },
  allPlaces: { de: 'Alle Orte', fr: 'Toutes les localités', en: 'All locations' },
  type: { de: 'Objektart', fr: 'Type de bien', en: 'Property type' },
  allTypes: { de: 'Alle Objektarten', fr: 'Tous les types', en: 'All types' },
  budget: { de: 'Preis bis', fr: 'Prix maximum', en: 'Price up to' },
  anyBudget: { de: 'Ohne Limite', fr: 'Sans limite', en: 'No limit' },
  showN: { de: '{n} Objekte anzeigen', fr: 'Voir les {n} biens', en: 'Show {n} properties' },
  heroPhoto: { de: 'Im Angebot', fr: 'En vente', en: 'On the market' },
  newTitle: { de: 'Neu im Angebot', fr: 'Nouveautés', en: 'New on the market' },
  allBuyN: { de: 'Alle {n} Kaufobjekte', fr: 'Les {n} biens à vendre', en: 'All {n} properties for sale' },
  allRentN: { de: 'Alle {n} Mietobjekte', fr: 'Les {n} biens à louer', en: 'All {n} properties to rent' },
  regionsTitleN: { de: 'Unsere Regionen', fr: 'Nos régions', en: 'Our regions' },
  regionCounts: { de: '{buy} zum Kauf · {rent} zur Miete', fr: '{buy} à vendre · {rent} à louer', en: '{buy} for sale · {rent} to rent' },
  regionCountsBuy: { de: '{buy} zum Kauf', fr: '{buy} à vendre', en: '{buy} for sale' },
  regionOf: { de: 'Region {city}', fr: 'Région {city}', en: '{city} region' },
  devBandTitle: { de: 'Neubau in {city}', fr: 'Logements neufs à {city}', en: 'New build in {city}' },
  devBandLine: {
    de: '{units} Eigentumswohnungen, {available} davon verfügbar. Bezug ab {delivery}.',
    fr: '{units} appartements en PPE, dont {available} disponibles. Livraison dès {delivery}.',
    en: '{units} freehold flats, {available} of them available. Move-in from {delivery}.',
  },
  toDevelopment: { de: 'Zum Projekt', fr: 'Voir le projet', en: 'View the development' },
  valuationTitle: { de: 'Was ist Ihre Immobilie heute wert?', fr: 'Que vaut votre bien aujourd’hui ?', en: 'What is your property worth today?' },
  valuationText: {
    de: 'Eine Beraterin oder ein Berater des Standorts in Ihrer Region besichtigt die Immobilie und erstellt eine schriftliche Bewertung. Kostenlos und unverbindlich.',
    fr: 'Un conseiller du bureau de votre région visite le bien et vous remet une estimation écrite. Gratuit et sans engagement.',
    en: 'An adviser from the office in your region visits the property and gives you a written valuation. Free, with no obligation.',
  },

  // calculator
  calcTitle: { de: 'Tragbarkeit berechnen', fr: 'Calculer la capacité financière', en: 'Check affordability' },
  calcLede: {
    de: 'Wie Banken in der Schweiz die Tragbarkeit prüfen, vereinfacht. Ändern Sie die Werte, das Ergebnis passt sich an.',
    fr: 'Le calcul de capacité financière des banques suisses, simplifié. Modifiez les valeurs, le résultat suit.',
    en: 'How Swiss banks check affordability, simplified. Change the figures and the result follows.',
  },
  calcPrice: { de: 'Kaufpreis', fr: 'Prix d’achat', en: 'Purchase price' },
  calcOwn: { de: 'Eigenmittel', fr: 'Fonds propres', en: 'Own funds' },
  calcIncome: { de: 'Bruttoeinkommen pro Jahr', fr: 'Revenu brut annuel', en: 'Gross annual income' },
  calcMortgage: { de: 'Hypothek', fr: 'Hypothèque', en: 'Mortgage' },
  calcLtv: { de: 'Belehnung', fr: 'Taux d’avance', en: 'Loan to value' },
  calcCosts: { de: 'Kalkulatorische Kosten pro Monat', fr: 'Charges théoriques par mois', en: 'Notional cost per month' },
  calcShare: { de: 'Anteil am Einkommen', fr: 'Part du revenu', en: 'Share of income' },
  calcOk: { de: 'Tragbar nach dieser Faustregel', fr: 'Supportable selon cette règle', en: 'Affordable under this rule of thumb' },
  calcNo: { de: 'Über der Grenze von einem Drittel', fr: 'Au-delà de la limite d’un tiers', en: 'Above the one-third limit' },
  calcOwnLow: { de: 'Weniger als 20 % Eigenmittel', fr: 'Moins de 20 % de fonds propres', en: 'Less than 20% own funds' },
  calcAssume: { de: 'Annahmen', fr: 'Hypothèses', en: 'Assumptions' },
  calcA1: {
    de: 'Mindestens 20 % Eigenmittel, davon höchstens 10 % aus der Pensionskasse.',
    fr: 'Au moins 20 % de fonds propres, dont au plus 10 % issus de la caisse de pension.',
    en: 'At least 20% own funds, of which no more than 10% from a pension fund.',
  },
  calcA2: {
    de: 'Kalkulatorischer Zins von 5 % auf der ganzen Hypothek, nicht der aktuelle Marktzins.',
    fr: 'Taux théorique de 5 % sur toute l’hypothèque, pas le taux du marché.',
    en: 'A notional 5% interest rate on the whole mortgage, not the current market rate.',
  },
  calcA3: {
    de: 'Nebenkosten und Unterhalt 1 % des Kaufpreises pro Jahr; die Belehnung über zwei Drittel wird in 15 Jahren amortisiert.',
    fr: 'Charges et entretien de 1 % du prix par an ; la part au-delà de deux tiers est amortie en 15 ans.',
    en: 'Running costs and upkeep of 1% of the price a year; the share above two thirds is repaid over 15 years.',
  },
  calcA4: {
    de: 'Die Kosten sollten ein Drittel des Bruttoeinkommens nicht übersteigen.',
    fr: 'Les charges ne devraient pas dépasser un tiers du revenu brut.',
    en: 'The cost should not exceed one third of gross income.',
  },
  calcNote: {
    de: 'Unverbindliche Richtrechnung. Ihre Bank prüft mit eigenen Ansätzen.',
    fr: 'Calcul indicatif et sans engagement. Votre banque applique ses propres règles.',
    en: 'Indicative only. Your bank applies its own criteria.',
  },

  // listing cards and pages
  sold: { de: 'Verkauft', fr: 'Vendu', en: 'Sold' },
  forSale: { de: 'Zu verkaufen', fr: 'À vendre', en: 'For sale' },
  forRent: { de: 'Zu vermieten', fr: 'À louer', en: 'To rent' },
  reserved: { de: 'Reserviert', fr: 'Réservé', en: 'Reserved' },
  available: { de: 'Verfügbar', fr: 'Disponible', en: 'Available' },
  noPhoto: { de: 'Foto folgt', fr: 'Photo à venir', en: 'Photo to follow' },
  photo: { de: 'Foto {n}', fr: 'photo {n}', en: 'photo {n}' },
  allPhotos: { de: 'Alle {n} Fotos', fr: 'Les {n} photos', en: 'All {n} photos' },
  photos: { de: 'Fotos', fr: 'Photos', en: 'Photos' },
  facts: { de: 'Eckdaten', fr: 'En bref', en: 'Key facts' },
  description: { de: 'Beschreibung', fr: 'Description', en: 'Description' },
  features: { de: 'Ausstattung', fr: 'Équipements', en: 'Features' },
  location: { de: 'Lage', fr: 'Situation', en: 'Location' },
  price: { de: 'Preis', fr: 'Prix', en: 'Price' },
  rent: { de: 'Miete', fr: 'Loyer', en: 'Rent' },
  charges: { de: 'Nebenkosten', fr: 'Charges', en: 'Service charges' },
  rooms: { de: 'Zimmer', fr: 'Pièces', en: 'Rooms' },
  bedrooms: { de: 'Schlafzimmer', fr: 'Chambres', en: 'Bedrooms' },
  bathrooms: { de: 'Badezimmer', fr: 'Salles d’eau', en: 'Bathrooms' },
  livingArea: { de: 'Wohnfläche', fr: 'Surface habitable', en: 'Living area' },
  landArea: { de: 'Grundstück', fr: 'Terrain', en: 'Plot' },
  terrace: { de: 'Terrasse', fr: 'Terrasse', en: 'Terrace' },
  balcony: { de: 'Balkon', fr: 'Balcon', en: 'Balcony' },
  loggia: { de: 'Loggia', fr: 'Loggia', en: 'Loggia' },
  garden: { de: 'Garten', fr: 'Jardin', en: 'Garden' },
  floor: { de: 'Etage', fr: 'Étage', en: 'Floor' },
  yearBuilt: { de: 'Baujahr', fr: 'Année de construction', en: 'Year built' },
  energy: { de: 'Energieetikette (GEAK)', fr: 'Étiquette énergétique (CECB)', en: 'Energy rating (GEAK)' },
  energyClass: { de: 'Klasse {c}', fr: 'Classe {c}', en: 'Class {c}' },
  reference: { de: 'Ref.', fr: 'Réf.', en: 'Ref.' },
  approxLocation: { de: 'Ungefähre Lage', fr: 'Emplacement approximatif', en: 'Approximate location' },
  openMap: { de: 'In OpenStreetMap öffnen', fr: 'Ouvrir dans OpenStreetMap', en: 'Open in OpenStreetMap' },
  yourAdvisor: { de: 'Ihre Ansprechperson', fr: 'Votre conseiller', en: 'Your adviser' },
  enquiry: { de: 'Anfrage', fr: 'Demande', en: 'Enquiry' },
  askViewing: { de: 'Besichtigung anfragen', fr: 'Demander une visite', en: 'Request a viewing' },
  call: { de: 'Anrufen', fr: 'Appeler', en: 'Call' },
  email: { de: 'E-Mail', fr: 'E-mail', en: 'Email' },
  phone: { de: 'Telefon', fr: 'Téléphone', en: 'Phone' },
  similar: { de: 'Weitere Objekte in {city}', fr: 'Autres biens à {city}', en: 'More in {city}' },
  officeOf: { de: 'Standort {city}', fr: 'Bureau de {city}', en: '{city} office' },
  partOfDev: { de: 'Diese Wohnung gehört zum Neubauprojekt {name}.', fr: 'Cet appartement fait partie du projet {name}.', en: 'This flat is part of the {name} development.' },
  seeAllUnits: { de: 'Alle Wohnungen ansehen', fr: 'Voir tous les appartements', en: 'See every flat' },
  soldNote: { de: 'Dieses Objekt ist verkauft.', fr: 'Ce bien est vendu.', en: 'This property has been sold.' },

  // search pages
  buyTitle: { de: 'Immobilien kaufen', fr: 'Biens à vendre', en: 'Properties for sale' },
  rentTitle: { de: 'Immobilien mieten', fr: 'Biens à louer', en: 'Properties to rent' },
  inCity: { de: 'in {city}', fr: 'à {city}', en: 'in {city}' },
  searchLede: {
    de: 'Wohnungen und Häuser unserer Standorte in {cities}.',
    fr: 'Appartements et maisons de nos bureaux de {cities}.',
    en: 'Flats and houses from our offices in {cities}.',
  },
  page: { de: 'Seite', fr: 'Page', en: 'Page' },
  mapView: { de: 'Karte', fr: 'Carte', en: 'Map' },

  // sell
  sellTitle: { de: 'Ihre Immobilie bewerten und verkaufen', fr: 'Estimer et vendre votre bien', en: 'Value and sell your property' },
  sellLede: {
    de: 'Sagen Sie uns, wo die Immobilie liegt. Der Standort Ihrer Region ruft Sie für einen Besichtigungstermin zurück.',
    fr: 'Indiquez-nous où se trouve le bien. Le bureau de votre région vous rappelle pour convenir d’une visite.',
    en: 'Tell us where the property is. The office for your region will call you back to arrange a visit.',
  },
  valuationForm: { de: 'Bewertung anfragen', fr: 'Demander une estimation', en: 'Request a valuation' },
  valuationMessage: {
    de: 'Guten Tag, ich möchte meine Immobilie bewerten lassen. Adresse: … Objektart: … Wohnfläche: …',
    fr: 'Bonjour, je souhaite faire estimer mon bien. Adresse : … Type : … Surface : …',
    en: 'Hello, I would like a valuation of my property. Address: … Type: … Living area: …',
  },
  howTitle: { de: 'So gehen wir vor', fr: 'Notre façon de faire', en: 'How we work' },
  how1h: { de: 'Besichtigung', fr: 'Visite', en: 'Visit' },
  how1: {
    de: 'Wir sehen uns die Immobilie mit Ihnen an, nehmen Grundbuchauszug, Pläne und Unterlagen der Stockwerkeigentümergemeinschaft auf.',
    fr: 'Nous visitons le bien avec vous et rassemblons extrait du registre foncier, plans et documents de la PPE.',
    en: 'We visit the property with you and collect the land register extract, plans and owners’ association papers.',
  },
  how2h: { de: 'Schriftliche Bewertung', fr: 'Estimation écrite', en: 'Written valuation' },
  how2: {
    de: 'Sie erhalten einen Preisvorschlag mit Begründung: Lage, Zustand, Vergleichsobjekte aus unseren eigenen Verkäufen.',
    fr: 'Vous recevez une proposition de prix argumentée : situation, état, comparaison avec nos propres ventes.',
    en: 'You receive a price proposal with the reasoning: location, condition and comparisons with our own sales.',
  },
  how3h: { de: 'Vermarktung und Verkauf', fr: 'Commercialisation et vente', en: 'Marketing and sale' },
  how3: {
    de: 'Fotos, Dokumentation, Inserate, Besichtigungen, Verhandlung und Beurkundung beim Notariat begleitet Ihre Ansprechperson bis zur Übergabe.',
    fr: 'Photos, dossier, annonces, visites, négociation et acte chez le notaire : votre conseiller vous accompagne jusqu’à la remise des clés.',
    en: 'Photos, brochure, adverts, viewings, negotiation and the notarial deed: your adviser stays with you until handover.',
  },
  recentSales: { de: 'Zuletzt verkauft', fr: 'Ventes récentes', en: 'Recently sold' },
  allSold: { de: 'Alle verkauften Objekte', fr: 'Tous les biens vendus', en: 'All sold properties' },

  // sold
  soldTitle: { de: 'Verkaufte Objekte', fr: 'Biens vendus', en: 'Sold properties' },
  soldLede: {
    de: 'Eine Auswahl der Objekte, die unsere Standorte verkauft haben. Verkaufspreise nennen wir nicht.',
    fr: 'Une sélection des biens vendus par nos bureaux. Nous ne publions pas les prix de vente.',
    en: 'A selection of properties our offices have sold. We do not publish sale prices.',
  },
  soldCta: { de: 'Sie denken an einen Verkauf?', fr: 'Vous pensez à vendre ?', en: 'Thinking of selling?' },

  // team, agents
  teamTitle: { de: 'Unsere Beraterinnen und Berater', fr: 'Nos conseillers', en: 'Our advisers' },
  teamLede: {
    de: '{n} Ansprechpersonen an {offices} Standorten, mit Direktnummer, E-Mail und den Sprachen, in denen Sie beraten werden.',
    fr: '{n} conseillers dans {offices} bureaux, avec ligne directe, e-mail et langues parlées.',
    en: '{n} advisers in {offices} offices, with direct line, email and the languages they speak.',
  },
  languages: { de: 'Sprachen', fr: 'Langues', en: 'Languages' },
  profile: { de: 'Profil', fr: 'Profil', en: 'Profile' },
  agentListings: { de: 'Objekte von {name}', fr: 'Biens présentés par {name}', en: 'Properties listed by {name}' },
  contactAgent: { de: '{name} schreiben', fr: 'Écrire à {name}', en: 'Write to {name}' },
  agentMessage: { de: 'Guten Tag {name}, ', fr: 'Bonjour {name}, ', en: 'Hello {name}, ' },
  noAgentListings: {
    de: 'Zurzeit keine Objekte online. {name} informiert Sie gerne über kommende Angebote.',
    fr: 'Aucun bien en ligne pour le moment. {name} vous renseigne volontiers sur les biens à venir.',
    en: 'No properties online at the moment. {name} can tell you about upcoming ones.',
  },
  adviserAt: { de: 'Beratung, Standort {city}', fr: 'Conseil, bureau de {city}', en: 'Adviser, {city} office' },

  // offices
  officesTitle: { de: 'Unsere Standorte', fr: 'Nos bureaux', en: 'Our offices' },
  officesLede: {
    de: 'Jedes Objekt wird vom Standort in seiner Region betreut. Hier finden Sie Adresse, Telefon und Team.',
    fr: 'Chaque bien est suivi par le bureau de sa région. Adresse, téléphone et équipe de chacun.',
    en: 'Every property is handled by the office for its region. Address, phone and team for each.',
  },
  team: { de: 'Team', fr: 'Équipe', en: 'Team' },
  officeListings: { de: 'Objekte des Standorts {city}', fr: 'Biens du bureau de {city}', en: 'Properties from the {city} office' },
  officeContact: { de: 'Dem Standort {city} schreiben', fr: 'Écrire au bureau de {city}', en: 'Write to the {city} office' },
  officeMessage: { de: 'Guten Tag, ich möchte vom Standort {city} kontaktiert werden.', fr: 'Bonjour, je souhaite être contacté(e) par le bureau de {city}.', en: 'Hello, I would like the {city} office to contact me.' },
  nAgents: { de: '{n} Ansprechpersonen', fr: '{n} conseillers', en: '{n} advisers' },
  nAgent1: { de: '1 Ansprechperson', fr: '1 conseiller', en: '1 adviser' },
  directions: { de: 'Route planen', fr: 'Itinéraire', en: 'Directions' },
  officeMap: { de: 'Karte der Standorte', fr: 'Carte des bureaux', en: 'Map of the offices' },
  covers: { de: 'Zuständig für', fr: 'Secteur', en: 'Covers' },

  // regions
  regionsPageTitle: { de: 'Regionen', fr: 'Régions', en: 'Regions' },
  regionsLede: {
    de: 'Kauf- und Mietobjekte nach Region und Ort, mit dem zuständigen Standort.',
    fr: 'Biens à vendre et à louer par région et localité, avec le bureau responsable.',
    en: 'Properties for sale and to rent by region and town, with the office in charge.',
  },
  regionTitle: { de: 'Immobilien in der Region {city}', fr: 'Immobilier dans la région de {city}', en: 'Property in the {city} region' },
  regionLede: {
    de: 'Wohnungen und Häuser in {places}, betreut vom Standort {city}.',
    fr: 'Appartements et maisons à {places}, suivis par le bureau de {city}.',
    en: 'Flats and houses in {places}, handled by the {city} office.',
  },
  placesTitle: { de: 'Orte', fr: 'Localités', en: 'Towns' },
  colPlace: { de: 'Ort', fr: 'Localité', en: 'Town' },
  colBuy: { de: 'Zum Kauf', fr: 'À vendre', en: 'For sale' },
  colRent: { de: 'Zur Miete', fr: 'À louer', en: 'To rent' },
  colPrices: { de: 'Angebotspreise', fr: 'Prix affichés', en: 'Asking prices' },
  regionAvailable: { de: 'Verfügbar in der Region {city}', fr: 'Disponible dans la région de {city}', en: 'Available in the {city} region' },
  regionSold: { de: 'Verkauft in der Region {city}', fr: 'Vendu dans la région de {city}', en: 'Sold in the {city} region' },
  regionNone: {
    de: 'Zurzeit kein Objekt in dieser Region. Der Standort {city} informiert Sie, sobald eines auf den Markt kommt.',
    fr: 'Aucun bien dans cette région pour le moment. Le bureau de {city} vous informe dès qu’un bien arrive sur le marché.',
    en: 'Nothing in this region at the moment. The {city} office will let you know when something comes up.',
  },
  pricesFromTo: { de: '{from} bis {to}', fr: 'de {from} à {to}', en: '{from} to {to}' },

  // developments
  devTitle: { de: 'Neubauprojekte', fr: 'Projets neufs', en: 'New developments' },
  devLede: {
    de: 'Neubauwohnungen, die wir im Auftrag der Bauherrschaft verkaufen: Preise, Grundrisse und Verfügbarkeit pro Wohnung.',
    fr: 'Appartements neufs que nous vendons pour le maître d’ouvrage : prix, plans et disponibilités par appartement.',
    en: 'New flats we sell on behalf of the developer: prices, plans and availability for every flat.',
  },
  delivery: { de: 'Bezug', fr: 'Livraison', en: 'Move-in' },
  deliveryFrom: { de: 'Bezug ab {d}', fr: 'Livraison dès {d}', en: 'Move-in from {d}' },
  units: { de: 'Wohnungen', fr: 'Appartements', en: 'Flats' },
  unit: { de: 'Wohnung', fr: 'Appartement', en: 'Flat' },
  unitN: { de: 'Wohnung {n}', fr: 'Appartement {n}', en: 'Flat {n}' },
  unitsAvailable: { de: '{n} von {t} verfügbar', fr: '{n} sur {t} disponibles', en: '{n} of {t} available' },
  priceFrom: { de: 'ab {p}', fr: 'dès {p}', en: 'from {p}' },
  priceAvail: { de: 'Preise und Verfügbarkeit', fr: 'Prix et disponibilités', en: 'Prices and availability' },
  typeFrom: { de: '{rooms} ab {p}', fr: '{rooms} dès {p}', en: '{rooms} from {p}' },
  nAvailable: { de: '{n} verfügbar', fr: '{n} disponibles', en: '{n} available' },
  nAvailable1: { de: '1 verfügbar', fr: '1 disponible', en: '1 available' },
  nReserved: { de: '{n} reserviert', fr: '{n} réservés', en: '{n} reserved' },
  nReserved1: { de: '1 reserviert', fr: '1 réservé', en: '1 reserved' },
  soldOut: { de: 'ausverkauft', fr: 'vendus', en: 'sold out' },
  reservedOnly: { de: 'alle reserviert', fr: 'tous réservés', en: 'all reserved' },
  asOf: { de: 'Stand {d}', fr: 'État au {d}', en: 'As of {d}' },
  developer: { de: 'Bauherrschaft', fr: 'Maître d’ouvrage', en: 'Developer' },
  architect: { de: 'Architektur', fr: 'Architecte', en: 'Architect' },
  contractor: { de: 'Generalunternehmung', fr: 'Entreprise générale', en: 'General contractor' },
  credits: { de: 'Beteiligte', fr: 'Intervenants', en: 'Project team' },
  table: { de: 'Alle Wohnungen', fr: 'Tous les appartements', en: 'Every flat' },
  onlyAvailable: { de: 'Nur verfügbare zeigen', fr: 'Seulement les disponibles', en: 'Available only' },
  colUnit: { de: 'Nr.', fr: 'N°', en: 'No.' },
  colFloor: { de: 'Geschoss', fr: 'Étage', en: 'Floor' },
  colRooms: { de: 'Zimmer', fr: 'Pièces', en: 'Rooms' },
  colArea: { de: 'Wohnfläche', fr: 'Surface', en: 'Area' },
  colOut: { de: 'Aussen', fr: 'Extérieur', en: 'Outdoor' },
  colPrice: { de: 'Preis', fr: 'Prix', en: 'Price' },
  colStatus: { de: 'Status', fr: 'Statut', en: 'Status' },
  plans: { de: 'Grundrisse', fr: 'Plans', en: 'Floor plans' },
  plan: { de: 'Grundriss', fr: 'Plan', en: 'Floor plan' },
  planIndicative: { de: 'Grundriss unverbindlich, nur zur Orientierung', fr: 'Plan indicatif, non contractuel', en: 'Indicative plan, not to scale for contract' },
  planOf: { de: 'Unverbindlicher Grundriss: {u}', fr: 'Plan indicatif : {u}', en: 'Indicative plan: {u}' },
  typeName: { de: 'Typ {k}', fr: 'Type {k}', en: 'Type {k}' },
  orientation: { de: 'Ausrichtung', fr: 'Orientation', en: 'Aspect' },
  outdoor: { de: 'Aussenfläche', fr: 'Extérieur', en: 'Outdoor space' },
  askUnit: { de: 'Diese Wohnung anfragen', fr: 'Demander cet appartement', en: 'Ask about this flat' },
  devContact: { de: 'Unterlagen und Besichtigung', fr: 'Documentation et visite', en: 'Documents and viewing' },
  documents: { de: 'Dokumente', fr: 'Documents', en: 'Documents' },
  brochure: { de: 'Projektbroschüre', fr: 'Brochure du projet', en: 'Project brochure' },
  priceList: { de: 'Preisliste', fr: 'Liste de prix', en: 'Price list' },
  otherUnits: { de: 'Weitere Wohnungen dieses Typs', fr: 'Autres appartements du même type', en: 'Other flats of this type' },
  backToDev: { de: 'Zurück zum Projekt', fr: 'Retour au projet', en: 'Back to the development' },
  unitSoldNote: { de: 'Diese Wohnung ist verkauft. Weitere Wohnungen des Projekts sind noch verfügbar.', fr: 'Cet appartement est vendu. D’autres appartements du projet sont encore disponibles.', en: 'This flat is sold. Other flats in the development are still available.' },
  unitReservedNote: { de: 'Diese Wohnung ist reserviert. Hinterlassen Sie Ihre Kontaktdaten, falls die Reservation aufgehoben wird.', fr: 'Cet appartement est réservé. Laissez vos coordonnées au cas où la réservation serait levée.', en: 'This flat is reserved. Leave your details in case the reservation is released.' },
  construction: { de: 'Baustelle', fr: 'Chantier', en: 'On site' },
  constructionNote: { de: 'Aufnahmen von der Baustelle', fr: 'Images du chantier', en: 'Photos from the building site' },
  seeListing: { de: 'Inserat ansehen', fr: 'Voir l’annonce', en: 'View the listing' },

  // about
  aboutTitle: { de: 'Über {name}', fr: 'À propos de {name}', en: 'About {name}' },
  aboutLede: {
    de: '{name} vermittelt Wohneigentum und Mietwohnungen in den Regionen {cities}.',
    fr: '{name} vend et loue des logements dans les régions de {cities}.',
    en: '{name} sells and lets homes in the {cities} regions.',
  },
  aboutFacts: { de: 'Heute', fr: 'Aujourd’hui', en: 'Today' },
  factOffices: { de: 'Standorte', fr: 'Bureaux', en: 'Offices' },
  factAdvisers: { de: 'Ansprechpersonen', fr: 'Conseillers', en: 'Advisers' },
  factListings: { de: 'Objekte im Angebot', fr: 'Biens en ligne', en: 'Properties on the market' },
  factLanguages: { de: 'Beratungssprachen', fr: 'Langues de conseil', en: 'Languages' },

  // contact
  contactTitle: { de: 'Kontakt', fr: 'Contact', en: 'Contact' },
  contactLede: {
    de: 'Schreiben Sie uns oder rufen Sie den Standort Ihrer Region direkt an. Ihre Nachricht geht an die zuständige Person.',
    fr: 'Écrivez-nous ou appelez directement le bureau de votre région. Votre message est transmis à la bonne personne.',
    en: 'Write to us or call the office for your region. Your message goes to the right person.',
  },
  writeUs: { de: 'Nachricht', fr: 'Message', en: 'Message' },

  // footer
  rights: { de: 'Alle Rechte vorbehalten.', fr: 'Tous droits réservés.', en: 'All rights reserved.' },

  // 404
  notFoundCode: { de: 'Fehler 404', fr: 'Erreur 404', en: 'Error 404' },
} satisfies Record<string, Record<L, string>>;

export type Key = keyof typeof T;

export const tx =
  (l: L) =>
  (key: Key, vars: Record<string, string | number> = {}) =>
    T[key][l].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));

/** "Zürich, Basel und Bern" / "Zurich, Bâle et Berne" / "Zurich, Basel and Bern". */
export const joinList = (items: string[], l: L) => {
  const and = { de: 'und', fr: 'et', en: 'and' }[l];
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}`;
};

/** City names in the page language (the data keeps the local name). */
const CITY: Record<string, Partial<Record<L, string>>> = {
  Zürich: { fr: 'Zurich', en: 'Zurich' },
  Basel: { fr: 'Bâle' },
  Bern: { fr: 'Berne' },
  'Muri bei Bern': { fr: 'Muri près de Berne', en: 'Muri bei Bern' },
};
export const cityName = (city: string | undefined, l: L) => (city ? (CITY[city]?.[l] ?? city) : '');

const LANG_NAMES: Record<string, Record<L, string>> = {
  de: { de: 'Deutsch', fr: 'allemand', en: 'German' },
  fr: { de: 'Französisch', fr: 'français', en: 'French' },
  en: { de: 'Englisch', fr: 'anglais', en: 'English' },
  it: { de: 'Italienisch', fr: 'italien', en: 'Italian' },
  es: { de: 'Spanisch', fr: 'espagnol', en: 'Spanish' },
  pt: { de: 'Portugiesisch', fr: 'portugais', en: 'Portuguese' },
};
export const langName = (code: string, l: L) => LANG_NAMES[code]?.[l] ?? code.toUpperCase();
export const langNames = (codes: string[] | undefined, l: L) => joinList((codes ?? []).map((c) => langName(c, l)), l);
