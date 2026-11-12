/**
 * Template strings (enquiry form, legal pages, consent banner, maps, 404,
 * listing features) in the site languages. The site language is `locale`
 * in site.json; a multi-language site lists its locales in `locales`.
 * Page copy belongs in the page; these strings are the kit parts' own.
 */
import site from 'virtual:sites-kit/site';
import { LOCALE } from './format';

export type Lang = 'de' | 'fr' | 'it' | 'es' | 'en';
export const lang = (locale: string = LOCALE): Lang => {
  const l = locale.slice(0, 2);
  return (['de', 'fr', 'it', 'es'] as const).includes(l as 'de') ? (l as Lang) : 'en';
};

const STRINGS = {
  name: { de: 'Name', fr: 'Nom', it: 'Nome', es: 'Nombre', en: 'Name' },
  email: { de: 'E-Mail', fr: 'E-mail', it: 'E-mail', es: 'Correo electrónico', en: 'Email' },
  phone: { de: 'Telefon', fr: 'Téléphone', it: 'Telefono', es: 'Teléfono', en: 'Phone' },
  optional: { de: '(optional)', fr: '(facultatif)', it: '(facoltativo)', es: '(opcional)', en: '(optional)' },
  message: { de: 'Nachricht', fr: 'Message', it: 'Messaggio', es: 'Mensaje', en: 'Message' },
  send: { de: 'Anfrage senden', fr: 'Envoyer ma demande', it: 'Invia la richiesta', es: 'Enviar mi solicitud', en: 'Send my enquiry' },
  sending: { de: 'Wird gesendet…', fr: 'Envoi…', it: 'Invio…', es: 'Enviando…', en: 'Sending…' },
  sent: {
    de: 'Vielen Dank. Wir melden uns so schnell wie möglich bei Ihnen.',
    fr: 'Merci. Nous vous recontactons dans les plus brefs délais.',
    it: 'Grazie. La ricontatteremo al più presto.',
    es: 'Gracias. Nos pondremos en contacto con usted lo antes posible.',
    en: 'Thank you. We will get back to you shortly.',
  },
  sentBy: {
    de: 'Vielen Dank. {name} meldet sich so schnell wie möglich bei Ihnen.',
    fr: 'Merci. {name} vous recontacte dans les plus brefs délais.',
    it: 'Grazie. {name} la ricontatterà al più presto.',
    es: 'Gracias. {name} se pondrá en contacto con usted lo antes posible.',
    en: 'Thank you. {name} will get back to you shortly.',
  },
  preview: {
    de: 'Vorschau: nicht gesendet.',
    fr: 'Aperçu : non envoyé.',
    it: 'Anteprima: non inviato.',
    es: 'Vista previa: no enviado.',
    en: 'Preview: not sent.',
  },
  error: {
    de: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder rufen Sie uns an.',
    fr: "L'envoi a échoué. Réessayez ou appelez-nous.",
    it: "Invio non riuscito. Riprovi o ci chiami.",
    es: 'No se pudo enviar. Inténtelo de nuevo o llámenos.',
    en: 'Could not send. Please try again or call us.',
  },
  verifyFailed: {
    de: 'Wir konnten nicht bestätigen, dass Sie kein Roboter sind. Bitte versuchen Sie es erneut.',
    fr: "Nous n'avons pas pu vérifier que vous n'êtes pas un robot. Veuillez réessayer.",
    it: 'Non siamo riusciti a verificare che non sia un robot. La preghiamo di riprovare.',
    es: 'No hemos podido verificar que no es un robot. Inténtelo de nuevo.',
    en: 'We could not verify that you are not a robot. Please try again.',
  },
  rejected: {
    de: 'Ihre Anfrage konnte nicht gesendet werden. Bitte kontaktieren Sie uns direkt per Telefon oder E-Mail.',
    fr: "Votre demande n'a pas pu être envoyée. Contactez-nous directement par téléphone ou par e-mail.",
    it: 'Non è stato possibile inviare la sua richiesta. Ci contatti direttamente per telefono o e-mail.',
    es: 'No se ha podido enviar su solicitud. Contacte con nosotros directamente por teléfono o correo electrónico.',
    en: 'Your enquiry could not be sent. Please contact us directly by phone or email.',
  },
  ref: { de: 'Ref.', fr: 'réf.', it: 'rif.', es: 'ref.', en: 'ref.' },
  interested: {
    de: 'Guten Tag, ich interessiere mich für «{title}» (Ref. {ref}). Bitte kontaktieren Sie mich.',
    fr: 'Bonjour, je suis intéressé(e) par « {title} » (réf. {ref}). Merci de me recontacter.',
    it: 'Buongiorno, sono interessato/a a «{title}» (rif. {ref}). Vi prego di ricontattarmi.',
    es: 'Hola, estoy interesado/a en «{title}» (ref. {ref}). Por favor, contacten conmigo.',
    en: 'Hello, I am interested in "{title}" (ref. {ref}). Please get back to me.',
  },
  required: { de: 'Pflichtfeld', fr: 'Champ obligatoire', it: 'Campo obbligatorio', es: 'Campo obligatorio', en: 'Required' },
  invalidEmail: {
    de: 'Bitte eine gültige E-Mail-Adresse eingeben',
    fr: 'Saisissez une adresse e-mail valide',
    it: 'Inserisca un indirizzo e-mail valido',
    es: 'Introduzca un correo electrónico válido',
    en: 'Enter a valid email address',
  },
  privacyNote: {
    de: 'Wir verwenden Ihre Angaben nur, um Ihre Anfrage zu beantworten.',
    fr: 'Vos données servent uniquement à répondre à votre demande.',
    it: 'I suoi dati servono solo a rispondere alla sua richiesta.',
    es: 'Sus datos solo se usan para responder a su solicitud.',
    en: 'We use your details only to answer your enquiry.',
  },
  privacyLink: { de: 'Datenschutz', fr: 'Confidentialité', it: 'Privacy', es: 'Privacidad', en: 'Privacy' },
  legalNotice: { de: 'Impressum', fr: 'Mentions légales', it: 'Note legali', es: 'Aviso legal', en: 'Legal notice' },
  privacyPolicy: {
    de: 'Datenschutzerklärung',
    fr: 'Politique de confidentialité',
    it: 'Informativa sulla privacy',
    es: 'Política de privacidad',
    en: 'Privacy policy',
  },
  consentText: {
    de: 'Wir möchten mit Analyse-Cookies messen, wie die Website genutzt wird. Sie können ablehnen.',
    fr: "Nous aimerions mesurer l'utilisation du site avec des cookies d'analyse. Vous pouvez refuser.",
    it: "Vorremmo misurare l'uso del sito con cookie analitici. Può rifiutare.",
    es: 'Queremos medir el uso del sitio con cookies analíticas. Puede rechazarlas.',
    en: 'We would like to measure how the site is used with analytics cookies. You can decline.',
  },
  accept: { de: 'Akzeptieren', fr: 'Accepter', it: 'Accetta', es: 'Aceptar', en: 'Accept' },
  decline: { de: 'Ablehnen', fr: 'Refuser', it: 'Rifiuta', es: 'Rechazar', en: 'Decline' },
  openInGoogleMaps: {
    de: 'In Google Maps öffnen',
    fr: 'Ouvrir dans Google Maps',
    it: 'Apri in Google Maps',
    es: 'Abrir en Google Maps',
    en: 'Open in Google Maps',
  },
  osmContributors: {
    de: 'OpenStreetMap-Mitwirkende',
    fr: 'contributeurs OpenStreetMap',
    it: 'contributori di OpenStreetMap',
    es: 'colaboradores de OpenStreetMap',
    en: 'OpenStreetMap contributors',
  },
  notFound: { de: 'Seite nicht gefunden', fr: 'Page introuvable', it: 'Pagina non trovata', es: 'Página no encontrada', en: 'Page not found' },
  notFoundText: {
    de: 'Diese Seite existiert nicht oder wurde verschoben.',
    fr: "Cette page n'existe pas ou a été déplacée.",
    it: 'Questa pagina non esiste o è stata spostata.',
    es: 'Esta página no existe o ha sido trasladada.',
    en: 'This page does not exist or has moved.',
  },
  listingGone: {
    de: 'Dieses Objekt ist nicht mehr verfügbar',
    fr: "Ce bien n'est plus disponible",
    it: 'Questo immobile non è più disponibile',
    es: 'Este inmueble ya no está disponible',
    en: 'This property is no longer available',
  },
  listingGoneText: {
    de: 'Es wurde verkauft, vermietet oder vom Markt genommen. Entdecken Sie unsere aktuellen Angebote.',
    fr: 'Il a été vendu, loué ou retiré du marché. Découvrez nos biens actuellement disponibles.',
    it: 'È stato venduto, affittato o ritirato dal mercato. Scopra i nostri immobili disponibili.',
    es: 'Se ha vendido, alquilado o retirado del mercado. Descubra nuestros inmuebles disponibles.',
    en: 'It has been sold, let or taken off the market. See the properties available now.',
  },
  home: { de: 'Startseite', fr: 'Accueil', it: 'Home', es: 'Inicio', en: 'Home' },
  allListings: { de: 'Alle Objekte', fr: 'Tous nos biens', it: 'Tutti gli immobili', es: 'Todos los inmuebles', en: 'All properties' },
  // Listings map (components/ListingsMap.astro)
  viewList: { de: 'Liste', fr: 'Liste', it: 'Elenco', es: 'Lista', en: 'List' },
  viewMap: { de: 'Karte', fr: 'Carte', it: 'Mappa', es: 'Mapa', en: 'Map' },
  zoomIn: { de: 'Vergrössern', fr: 'Zoomer', it: 'Ingrandisci', es: 'Acercar', en: 'Zoom in' },
  zoomOut: { de: 'Verkleinern', fr: 'Dézoomer', it: 'Riduci', es: 'Alejar', en: 'Zoom out' },
  mapLabel: {
    de: 'Karte der Objekte',
    fr: 'Carte des biens',
    it: 'Mappa degli immobili',
    es: 'Mapa de los inmuebles',
    en: 'Map of the properties',
  },
  showAll: { de: 'Alle anzeigen', fr: 'Tout afficher', it: 'Mostra tutti', es: 'Mostrar todos', en: 'Show all' },
  close: { de: 'Schliessen', fr: 'Fermer', it: 'Chiudi', es: 'Cerrar', en: 'Close' },
  // Listing search (components/ListingsSearch.astro)
  filters: { de: 'Filter', fr: 'Filtres', it: 'Filtri', es: 'Filtros', en: 'Filters' },
  all: { de: 'Alle', fr: 'Tous', it: 'Tutti', es: 'Todos', en: 'All' },
  offerBuy: { de: 'Kaufen', fr: 'Acheter', it: 'Comprare', es: 'Comprar', en: 'Buy' },
  offerRent: { de: 'Mieten', fr: 'Louer', it: 'Affittare', es: 'Alquilar', en: 'Rent' },
  city: { de: 'Ort', fr: 'Localité', it: 'Località', es: 'Localidad', en: 'Location' },
  allCities: { de: 'Alle Orte', fr: 'Toutes les localités', it: 'Tutte le località', es: 'Todas las localidades', en: 'All locations' },
  minPrice: { de: 'Preis ab', fr: 'Prix min.', it: 'Prezzo min.', es: 'Precio mín.', en: 'Min. price' },
  maxPrice: { de: 'Preis bis', fr: 'Prix max.', it: 'Prezzo max.', es: 'Precio máx.', en: 'Max. price' },
  minRooms: { de: 'Zimmer ab', fr: 'Pièces min.', it: 'Locali min.', es: 'Habitaciones mín.', en: 'Min. rooms' },
  any: { de: 'Egal', fr: 'Indifférent', it: 'Indifferente', es: 'Indiferente', en: 'Any' },
  roomsMin: { de: 'ab {n} Zimmer', fr: '{n} pièces et +', it: '{n} locali e più', es: '{n} hab. o más', en: '{n}+ rooms' },
  priceMin: { de: 'ab {price}', fr: 'dès {price}', it: 'da {price}', es: 'desde {price}', en: 'from {price}' },
  priceMax: { de: 'bis {price}', fr: "jusqu'à {price}", it: 'fino a {price}', es: 'hasta {price}', en: 'up to {price}' },
  sort: { de: 'Sortieren', fr: 'Trier', it: 'Ordina', es: 'Ordenar', en: 'Sort' },
  'sort_newest': { de: 'Neueste', fr: 'Plus récents', it: 'Più recenti', es: 'Más recientes', en: 'Newest' },
  'sort_price-asc': { de: 'Preis aufsteigend', fr: 'Prix croissant', it: 'Prezzo crescente', es: 'Precio ascendente', en: 'Price: low to high' },
  'sort_price-desc': { de: 'Preis absteigend', fr: 'Prix décroissant', it: 'Prezzo decrescente', es: 'Precio descendente', en: 'Price: high to low' },
  'sort_surface-desc': { de: 'Grösste Fläche', fr: 'Plus grande surface', it: 'Superficie maggiore', es: 'Mayor superficie', en: 'Largest area' },
  apply: { de: 'Suchen', fr: 'Rechercher', it: 'Cerca', es: 'Buscar', en: 'Search' },
  resetFilters: { de: 'Filter zurücksetzen', fr: 'Réinitialiser', it: 'Azzera i filtri', es: 'Borrar filtros', en: 'Clear filters' },
  removeFilter: { de: '{filter} entfernen', fr: 'Retirer {filter}', it: 'Rimuovi {filter}', es: 'Quitar {filter}', en: 'Remove {filter}' },
  activeFilters: { de: 'Aktive Filter', fr: 'Filtres actifs', it: 'Filtri attivi', es: 'Filtros activos', en: 'Active filters' },
  noMatch: {
    de: 'Kein Objekt entspricht Ihrer Suche',
    fr: 'Aucun bien ne correspond à votre recherche',
    it: 'Nessun immobile corrisponde alla sua ricerca',
    es: 'Ningún inmueble coincide con su búsqueda',
    en: 'No property matches your search',
  },
  noMatchText: {
    de: 'Lockern Sie einen Filter oder sagen Sie uns, was Sie suchen: Wir melden uns, sobald ein passendes Objekt frei wird.',
    fr: 'Assouplissez un filtre, ou dites-nous ce que vous cherchez : nous vous écrivons dès qu’un bien correspond.',
    it: 'Allenti un filtro, o ci dica cosa cerca: la contattiamo appena un immobile corrisponde.',
    es: 'Quite un filtro o díganos qué busca: le escribimos en cuanto un inmueble coincida.',
    en: 'Loosen a filter, or tell us what you are looking for: we will write as soon as a property matches.',
  },
  noListings: {
    de: 'Zurzeit sind keine Objekte ausgeschrieben',
    fr: 'Aucun bien en ligne pour le moment',
    it: 'Al momento nessun immobile in vendita o in affitto',
    es: 'Ningún inmueble publicado por el momento',
    en: 'No properties on the market right now',
  },
  noListingsText: {
    de: 'Neue Objekte kommen laufend dazu. Sie möchten verkaufen? Wir bewerten Ihre Immobilie gerne.',
    fr: 'De nouveaux biens arrivent régulièrement. Vous vendez ? Nous estimons votre bien.',
    it: 'Nuovi immobili arrivano di continuo. Vuole vendere? Valutiamo il suo immobile.',
    es: 'Llegan inmuebles nuevos con regularidad. ¿Vende? Valoramos su inmueble.',
    en: 'New properties come in all the time. Selling? We will value your property.',
  },
  valuation: { de: 'Immobilie bewerten', fr: 'Estimer mon bien', it: 'Valuta il mio immobile', es: 'Valorar mi inmueble', en: 'Value my property' },
  tellUs: { de: 'Suchauftrag erteilen', fr: 'Confier ma recherche', it: 'Affidateci la ricerca', es: 'Encárguenos la búsqueda', en: 'Tell us what you need' },
  soldListings: { de: 'Verkaufte Objekte', fr: 'Biens vendus', it: 'Immobili venduti', es: 'Inmuebles vendidos', en: 'Sold properties' },
  currentListings: { de: 'Aktuelle Angebote', fr: 'Biens disponibles', it: 'Immobili disponibili', es: 'Inmuebles disponibles', en: 'Available properties' },
  pagination: { de: 'Seiten', fr: 'Pages', it: 'Pagine', es: 'Páginas', en: 'Pages' },
  page: { de: 'Seite', fr: 'Page', it: 'Pagina', es: 'Página', en: 'Page' },
  prevPage: { de: 'Zurück', fr: 'Précédent', it: 'Precedente', es: 'Anterior', en: 'Previous' },
  nextPage: { de: 'Weiter', fr: 'Suivant', it: 'Successiva', es: 'Siguiente', en: 'Next' },
  mapTruncated: {
    de: 'Die ersten {n} Objekte. Verfeinern Sie die Suche, um alle zu sehen.',
    fr: 'Les {n} premiers biens. Affinez la recherche pour tout voir.',
    it: 'I primi {n} immobili. Affini la ricerca per vederli tutti.',
    es: 'Los {n} primeros inmuebles. Afine la búsqueda para verlos todos.',
    en: 'The first {n} properties. Refine the search to see them all.',
  },
  noCoords: {
    de: 'Für diese Objekte ist keine Lage bekannt.',
    fr: 'La situation de ces biens n’est pas connue.',
    it: 'La posizione di questi immobili non è nota.',
    es: 'La ubicación de estos inmuebles no se conoce.',
    en: 'The location of these properties is not known.',
  },
  searchAsMove: { de: 'Beim Verschieben suchen', fr: 'Rechercher en déplaçant la carte', it: 'Cerca spostando la mappa', es: 'Buscar al mover el mapa', en: 'Search as I move the map' },
  searchThisArea: { de: 'In diesem Bereich suchen', fr: 'Rechercher dans cette zone', it: 'Cerca in questa zona', es: 'Buscar en esta zona', en: 'Search this area' },
  mapArea: { de: 'Kartenausschnitt', fr: 'Zone de la carte', it: 'Zona della mappa', es: 'Zona del mapa', en: 'Map area' },
  noneInArea: {
    de: 'Kein Objekt in diesem Kartenausschnitt',
    fr: 'Aucun bien dans cette zone',
    it: 'Nessun immobile in questa zona',
    es: 'Ningún inmueble en esta zona',
    en: 'No property in this area',
  },
  noneInAreaText: {
    de: 'Verschieben oder verkleinern Sie die Karte, oder suchen Sie überall.',
    fr: 'Déplacez ou dézoomez la carte, ou cherchez partout.',
    it: 'Sposti o riduca la mappa, oppure cerchi ovunque.',
    es: 'Mueva o aleje el mapa, o busque en todas partes.',
    en: 'Move or zoom out the map, or search everywhere.',
  },
  loading: { de: 'Wird geladen…', fr: 'Chargement…', it: 'Caricamento…', es: 'Cargando…', en: 'Loading…' },
  // Developments (lib/developments.ts, src/pages/developments/)
  developments: { de: 'Neubauprojekte', fr: 'Promotions neuves', it: 'Nuove costruzioni', es: 'Obra nueva', en: 'New developments' },
  units: { de: 'Wohnungen', fr: 'Lots', it: 'Unità', es: 'Viviendas', en: 'Units' },
  rooms: { de: 'Zimmer', fr: 'Pièces', it: 'Locali', es: 'Habitaciones', en: 'Rooms' },
  unit: { de: 'Wohnung', fr: 'Lot', it: 'Unità', es: 'Vivienda', en: 'Unit' },
  floor: { de: 'Etage', fr: 'Étage', it: 'Piano', es: 'Planta', en: 'Floor' },
  livingArea: { de: 'Wohnfläche', fr: 'Surface habitable', it: 'Superficie abitabile', es: 'Superficie habitable', en: 'Living area' },
  price: { de: 'Preis', fr: 'Prix', it: 'Prezzo', es: 'Precio', en: 'Price' },
  status: { de: 'Status', fr: 'Statut', it: 'Stato', es: 'Estado', en: 'Status' },
  available: { de: 'Verfügbar', fr: 'Disponible', it: 'Disponibile', es: 'Disponible', en: 'Available' },
  reserved: { de: 'Reserviert', fr: 'Réservé', it: 'Riservato', es: 'Reservado', en: 'Reserved' },
  sold: { de: 'Verkauft', fr: 'Vendu', it: 'Venduto', es: 'Vendido', en: 'Sold' },
  priceOnRequest: { de: 'Preis auf Anfrage', fr: 'Prix sur demande', it: 'Prezzo su richiesta', es: 'Precio a consultar', en: 'Price on request' },
  priceFrom: { de: 'ab {price}', fr: 'dès {price}', it: 'da {price}', es: 'desde {price}', en: 'from {price}' },
  seeListing: { de: 'Zum Inserat', fr: "Voir l'annonce", it: "Vedi l'annuncio", es: 'Ver el anuncio', en: 'See the listing' },
  delivery: { de: 'Bezug', fr: 'Livraison', it: 'Consegna', es: 'Entrega', en: 'Completion' },
  developer: { de: 'Bauherrschaft', fr: 'Promoteur', it: 'Promotore', es: 'Promotor', en: 'Developer' },
  documents: { de: 'Dokumente', fr: 'Documents', it: 'Documenti', es: 'Documentos', en: 'Documents' },
  location: { de: 'Lage', fr: 'Situation', it: 'Posizione', es: 'Ubicación', en: 'Location' },
  contactUs: { de: 'Kontakt', fr: 'Nous contacter', it: 'Contattaci', es: 'Contacto', en: 'Contact us' },
  devInterested: {
    de: 'Guten Tag, ich interessiere mich für das Projekt «{title}». Bitte senden Sie mir die Unterlagen.',
    fr: 'Bonjour, je suis intéressé(e) par la promotion « {title} ». Merci de m’envoyer la documentation.',
    it: 'Buongiorno, sono interessato/a al progetto «{title}». Vi prego di inviarmi la documentazione.',
    es: 'Hola, estoy interesado/a en la promoción «{title}». Por favor, envíenme la documentación.',
    en: 'Hello, I am interested in the "{title}" development. Please send me the documentation.',
  },
  unitInterested: {
    de: 'Guten Tag, ich interessiere mich für die Wohnung {unit} im Projekt «{title}». Bitte senden Sie mir Grundriss und Baubeschrieb.',
    fr: 'Bonjour, je suis intéressé(e) par le lot {unit} de la promotion « {title} ». Merci de m’envoyer le plan et le descriptif.',
    it: 'Buongiorno, sono interessato/a all’unità {unit} del progetto «{title}». Vi prego di inviarmi la planimetria e il capitolato.',
    es: 'Hola, estoy interesado/a en la vivienda {unit} de la promoción «{title}». Por favor, envíenme el plano y la memoria.',
    en: 'Hello, I am interested in unit {unit} of the "{title}" development. Please send me the floor plan and specification.',
  },
  unitOfInterest: { de: 'Gewünschte Wohnung', fr: 'Lot qui vous intéresse', it: 'Unità di interesse', es: 'Vivienda de interés', en: 'Unit of interest' },
  chooseUnit: { de: 'Wählen Sie eine Wohnung', fr: 'Choisissez un lot', it: "Scelga un'unità", es: 'Elija una vivienda', en: 'Choose a unit' },
  unitRequired: {
    de: 'Bitte wählen Sie die Wohnung, die Sie interessiert',
    fr: 'Choisissez le lot qui vous intéresse',
    it: "Scelga l'unità che le interessa",
    es: 'Elija la vivienda que le interesa',
    en: 'Choose the unit you are interested in',
  },
  askUnit: { de: 'Anfragen', fr: 'Se renseigner', it: 'Richiedi info', es: 'Pedir información', en: 'Enquire' },
  devStatus_planning: { de: 'In Planung', fr: 'En projet', it: 'In progetto', es: 'En proyecto', en: 'In planning' },
  devStatus_construction: { de: 'Im Bau', fr: 'En construction', it: 'In costruzione', es: 'En construcción', en: 'Under construction' },
  devStatus_marketing: { de: 'In Vermarktung', fr: 'En commercialisation', it: 'In vendita', es: 'En comercialización', en: 'On sale' },
  devStatus_delivered: { de: 'Fertiggestellt', fr: 'Livré', it: 'Consegnato', es: 'Entregado', en: 'Completed' },
  features: { de: 'Ausstattung', fr: 'Équipements', it: 'Dotazioni', es: 'Equipamiento', en: 'Features' },
  reference: { de: 'Referenz', fr: 'Référence', it: 'Riferimento', es: 'Referencia', en: 'Reference' },
  // Listing facts: the label of offerTypeLabel() and propertyTypeLabel() values.
  offer: { de: 'Angebot', fr: 'Transaction', it: 'Contratto', es: 'Operación', en: 'Offer' },
  propertyType: { de: 'Objektart', fr: 'Type de bien', it: 'Tipologia', es: 'Tipo de inmueble', en: 'Property type' },
} as const;

type Plural = Record<Lang, { one: string; other: string }>;
/** Counted phrases: `count('listingsFound', 121)` -> "121 annonces trouvées". */
const PLURALS = {
  listingsFound: {
    de: { one: '{n} Objekt gefunden', other: '{n} Objekte gefunden' },
    fr: { one: '{n} annonce trouvée', other: '{n} annonces trouvées' },
    it: { one: '{n} annuncio trovato', other: '{n} annunci trovati' },
    es: { one: '{n} anuncio encontrado', other: '{n} anuncios encontrados' },
    en: { one: '{n} property found', other: '{n} properties found' },
  },
  listings: {
    de: { one: '{n} Objekt', other: '{n} Objekte' },
    fr: { one: '{n} bien', other: '{n} biens' },
    it: { one: '{n} immobile', other: '{n} immobili' },
    es: { one: '{n} inmueble', other: '{n} inmuebles' },
    en: { one: '{n} property', other: '{n} properties' },
  },
  inArea: {
    de: { one: '{n} Objekt in diesem Kartenausschnitt', other: '{n} Objekte in diesem Kartenausschnitt' },
    fr: { one: '{n} bien dans cette zone', other: '{n} biens dans cette zone' },
    it: { one: '{n} immobile in questa zona', other: '{n} immobili in questa zona' },
    es: { one: '{n} inmueble en esta zona', other: '{n} inmuebles en esta zona' },
    en: { one: '{n} property in this area', other: '{n} properties in this area' },
  },
  showListings: {
    de: { one: '{n} Objekt anzeigen', other: '{n} Objekte anzeigen' },
    fr: { one: 'Voir {n} bien', other: 'Voir {n} biens' },
    it: { one: 'Mostra {n} immobile', other: 'Mostra {n} immobili' },
    es: { one: 'Ver {n} inmueble', other: 'Ver {n} inmuebles' },
    en: { one: 'Show {n} property', other: 'Show {n} properties' },
  },
  unitsAvailable: {
    de: { one: '{n} Wohnung verfügbar', other: '{n} Wohnungen verfügbar' },
    fr: { one: '{n} lot disponible', other: '{n} lots disponibles' },
    it: { one: '{n} unità disponibile', other: '{n} unità disponibili' },
    es: { one: '{n} vivienda disponible', other: '{n} viviendas disponibles' },
    en: { one: '{n} unit available', other: '{n} units available' },
  },
  unitsTotal: {
    de: { one: '{n} Wohnung', other: '{n} Wohnungen' },
    fr: { one: '{n} lot', other: '{n} lots' },
    it: { one: '{n} unità', other: '{n} unità' },
    es: { one: '{n} vivienda', other: '{n} viviendas' },
    en: { one: '{n} unit', other: '{n} units' },
  },
} satisfies Record<string, Plural>;

/**
 * A counted phrase with the right plural (French: 0 and 1 are singular):
 * `count('listingsFound', total)`. Never build "{n} annonces trouvée" by hand.
 */
export function count(key: keyof typeof PLURALS, n: number, l: Lang = lang()): string {
  const forms: { one: string; other: string } = PLURALS[key][l];
  const form = new Intl.PluralRules(l).select(n) === 'one' ? forms.one : forms.other;
  return form.replace('{n}', new Intl.NumberFormat(lang(LOCALE) === l ? LOCALE : l).format(n));
}

/** Both forms of a counted phrase, for client scripts (`Intl.PluralRules` in the browser). */
export const pluralForms = (key: keyof typeof PLURALS, l: Lang = lang()) => PLURALS[key][l];

/**
 * Listing feature keys (`listing.features`, unit features) in the site
 * languages. Never print a raw key: `featureLabel(key)`.
 */
const FEATURES: Record<string, Record<Lang, string>> = {
  elevator: { de: 'Lift', fr: 'Ascenseur', it: 'Ascensore', es: 'Ascensor', en: 'Lift' },
  balcony: { de: 'Balkon', fr: 'Balcon', it: 'Balcone', es: 'Balcón', en: 'Balcony' },
  parking: { de: 'Parkplatz', fr: 'Place de parc', it: 'Posteggio', es: 'Aparcamiento', en: 'Parking' },
  terrace: { de: 'Terrasse', fr: 'Terrasse', it: 'Terrazza', es: 'Terraza', en: 'Terrace' },
  garden: { de: 'Garten', fr: 'Jardin', it: 'Giardino', es: 'Jardín', en: 'Garden' },
  garage: { de: 'Garage', fr: 'Garage', it: 'Garage', es: 'Garaje', en: 'Garage' },
  pool: { de: 'Schwimmbad', fr: 'Piscine', it: 'Piscina', es: 'Piscina', en: 'Swimming pool' },
  swimming_pool: { de: 'Schwimmbad', fr: 'Piscine', it: 'Piscina', es: 'Piscina', en: 'Swimming pool' },
  view: { de: 'Aussicht', fr: 'Vue', it: 'Vista', es: 'Vistas', en: 'View' },
  lake_view: { de: 'Seesicht', fr: 'Vue sur le lac', it: 'Vista lago', es: 'Vistas al lago', en: 'Lake view' },
  fireplace: { de: 'Cheminée', fr: 'Cheminée', it: 'Camino', es: 'Chimenea', en: 'Fireplace' },
  cellar: { de: 'Keller', fr: 'Cave', it: 'Cantina', es: 'Trastero', en: 'Cellar' },
  air_conditioning: { de: 'Klimaanlage', fr: 'Climatisation', it: 'Aria condizionata', es: 'Aire acondicionado', en: 'Air conditioning' },
  wheelchair_accessible: { de: 'Rollstuhlgängig', fr: 'Accès handicapés', it: 'Accessibile in sedia a rotelle', es: 'Accesible', en: 'Wheelchair accessible' },
  minergie: { de: 'Minergie', fr: 'Minergie', it: 'Minergie', es: 'Minergie', en: 'Minergie' },
};
// Regional wording: "place de parc" is Swiss French; France says "parking".
const REGIONAL: Record<string, Record<string, string>> = {
  'fr-FR': { parking: 'Parking' },
};

/**
 * A feature key in the page language: `featureLabel('elevator')` -> "Ascenseur".
 * Unknown keys are humanised (`wine_cellar` -> "Wine cellar"), never shown raw.
 */
export function featureLabel(key: string, locale: string = LOCALE): string {
  const regional = REGIONAL[locale]?.[key];
  if (regional) return regional;
  const known = FEATURES[key]?.[lang(locale)];
  if (known) return known;
  const words = key.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * A listing's offer type as a label: `offerTypeLabel(l.offerType)` -> "À vendre"
 * / "For sale", "À louer" / "For rent". Never print `offerType` itself, nor a
 * filter verb ("Acheter", "Buy") as a listing's value.
 */
const OFFER_TYPES: Record<'buy' | 'rent', Record<Lang, string>> = {
  buy: { de: 'Zu verkaufen', fr: 'À vendre', it: 'In vendita', es: 'En venta', en: 'For sale' },
  rent: { de: 'Zu vermieten', fr: 'À louer', it: 'In affitto', es: 'En alquiler', en: 'For rent' },
};
export function offerTypeLabel(offerType: string, locale: string = LOCALE): string {
  return OFFER_TYPES[offerType === 'rent' ? 'rent' : 'buy'][lang(locale)];
}

/**
 * CRM property type codes (`listing.propertyType`, `apartment_duplex`) in the
 * site languages. Subtypes not listed fall back to their family
 * (`apartment_loft_x` -> "Appartement"), unknown families to "Bien" /
 * "Property". Never print the code, nor a generic "Bien" when the type is known.
 */
const PROPERTY_TYPES: Record<string, Record<Lang, string>> = {
  apartment: { de: 'Wohnung', fr: 'Appartement', it: 'Appartamento', es: 'Piso', en: 'Apartment' },
  apartment_duplex: { de: 'Maisonette', fr: 'Duplex', it: 'Duplex', es: 'Dúplex', en: 'Duplex' },
  apartment_penthouse: { de: 'Attikawohnung', fr: 'Attique', it: 'Attico', es: 'Ático', en: 'Penthouse' },
  apartment_penthouse_duplex: { de: 'Attika-Maisonette', fr: 'Attique en duplex', it: 'Attico duplex', es: 'Ático dúplex', en: 'Duplex penthouse' },
  apartment_studio: { de: 'Studio', fr: 'Studio', it: 'Monolocale', es: 'Estudio', en: 'Studio' },
  apartment_roof_flat: { de: 'Dachwohnung', fr: 'Appartement sous les toits', it: 'Mansarda', es: 'Buhardilla', en: 'Attic flat' },
  apartment_furnished_flat: { de: 'Möblierte Wohnung', fr: 'Appartement meublé', it: 'Appartamento arredato', es: 'Piso amueblado', en: 'Furnished apartment' },
  apartment_loft: { de: 'Loft', fr: 'Loft', it: 'Loft', es: 'Loft', en: 'Loft' },
  house: { de: 'Haus', fr: 'Maison', it: 'Casa', es: 'Casa', en: 'House' },
  house_detached: { de: 'Einfamilienhaus', fr: 'Maison individuelle', it: 'Casa unifamiliare', es: 'Casa unifamiliar', en: 'Detached house' },
  house_semi_detached: { de: 'Doppelhaushälfte', fr: 'Maison jumelée', it: 'Casa bifamiliare', es: 'Casa pareada', en: 'Semi-detached house' },
  house_villa: { de: 'Villa', fr: 'Villa', it: 'Villa', es: 'Villa', en: 'Villa' },
  house_chalet: { de: 'Chalet', fr: 'Chalet', it: 'Chalet', es: 'Chalet', en: 'Chalet' },
  house_terraced: { de: 'Reihenhaus', fr: 'Maison mitoyenne', it: 'Casa a schiera', es: 'Casa adosada', en: 'Terraced house' },
  house_attached_middle: { de: 'Reihenmittelhaus', fr: 'Maison mitoyenne', it: 'Casa a schiera', es: 'Casa adosada', en: 'Terraced house' },
  house_attached_end: { de: 'Reiheneckhaus', fr: 'Maison mitoyenne en bout', it: 'Casa a schiera di testa', es: 'Casa adosada de esquina', en: 'End-of-terrace house' },
  house_multiple_dwelling: { de: 'Mehrfamilienhaus', fr: 'Immeuble', it: 'Casa plurifamiliare', es: 'Edificio residencial', en: 'Apartment building' },
  house_farm: { de: 'Bauernhaus', fr: 'Ferme', it: 'Casale', es: 'Masía', en: 'Farmhouse' },
  prop: { de: 'Grundstück', fr: 'Terrain', it: 'Terreno', es: 'Terreno', en: 'Land' },
  prop_building_land: { de: 'Bauland', fr: 'Terrain à bâtir', it: 'Terreno edificabile', es: 'Solar', en: 'Building land' },
  indus: { de: 'Gewerbeobjekt', fr: 'Local commercial', it: 'Immobile commerciale', es: 'Local comercial', en: 'Commercial property' },
  indus_commercial: { de: 'Gewerbefläche', fr: 'Surface commerciale', it: 'Spazio commerciale', es: 'Local comercial', en: 'Commercial space' },
  indus_office: { de: 'Büro', fr: 'Bureau', it: 'Ufficio', es: 'Oficina', en: 'Office' },
  indus_workshop: { de: 'Werkstatt', fr: 'Atelier', it: 'Laboratorio', es: 'Taller', en: 'Workshop' },
  indus_medical_practice: { de: 'Arztpraxis', fr: 'Cabinet médical', it: 'Studio medico', es: 'Consulta médica', en: 'Medical practice' },
  gastro: { de: 'Gastgewerbe', fr: 'Hôtellerie-restauration', it: 'Ristorazione', es: 'Hostelería', en: 'Hospitality' },
  gastro_hotel: { de: 'Hotel', fr: 'Hôtel', it: 'Albergo', es: 'Hotel', en: 'Hotel' },
  gastro_restaurant: { de: 'Restaurant', fr: 'Restaurant', it: 'Ristorante', es: 'Restaurante', en: 'Restaurant' },
  parking: { de: 'Parkplatz', fr: 'Place de parc', it: 'Posteggio', es: 'Plaza de aparcamiento', en: 'Parking space' },
  garage: { de: 'Garage', fr: 'Garage', it: 'Garage', es: 'Garaje', en: 'Garage' },
  other: { de: 'Objekt', fr: 'Bien', it: 'Immobile', es: 'Inmueble', en: 'Property' },
};
const PROPERTY_REGIONAL: Record<string, Record<string, string>> = {
  'fr-FR': { apartment_penthouse: 'Appartement terrasse', parking: 'Parking' },
};
export function propertyTypeLabel(code: string | null | undefined, locale: string = LOCALE): string {
  const regional = code ? PROPERTY_REGIONAL[locale]?.[code] : undefined;
  if (regional) return regional;
  let key = code ?? '';
  while (key && !PROPERTY_TYPES[key]) key = key.includes('_') ? key.slice(0, key.lastIndexOf('_')) : '';
  return (PROPERTY_TYPES[key] ?? PROPERTY_TYPES.other!)[lang(locale)];
}

export type StringKey = keyof typeof STRINGS;

/** Template string in the site language; `{name}` placeholders are filled from `vars`. */
export function t(key: StringKey, vars: Record<string, string> = {}, l: Lang = lang()): string {
  return STRINGS[key][l].replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}

/**
 * Site locales (site.json `locales`), the default (unprefixed URLs) first,
 * e.g. `['fr-CH', 'en-CH']`: the other languages live under `/en/...`.
 * One language (most sites): just `locale`.
 */
export const LOCALES: readonly string[] = site.locales;

/** `/en/...` for a non-default locale, the path itself for the default one. */
export function localePath(path: string, locale: string = LOCALES[0]!): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (locale === LOCALES[0] || !LOCALES.includes(locale)) return p;
  return `/${lang(locale)}${p === '/' ? '' : p}`;
}

/** The locale a URL path belongs to (`/en/legal` -> 'en-CH'), else the default. */
export function localeOfPath(pathname: string): string {
  const seg = pathname.split('/')[1] ?? '';
  return LOCALES.slice(1).find((l) => lang(l) === seg) ?? LOCALES[0]!;
}

/**
 * Legal page paths in the page's language. Footers on every language use
 * these: `<a href={legalPath(locale)}>{t('legalNotice', {}, lang(locale))}</a>`.
 * `/legal` and `/privacy` for the default language, `/en/legal`, ... for the
 * others (src/pages/[lang]/legal.astro and privacy.astro serve them).
 */
export const legalPath = (locale: string = LOCALES[0]!) => localePath('/legal', locale);
export const privacyPath = (locale: string = LOCALES[0]!) => localePath('/privacy', locale);
/** Default-language paths (single-language sites). */
export const LEGAL_PATH = legalPath();
export const PRIVACY_PATH = privacyPath();
