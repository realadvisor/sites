/**
 * Legal notice and privacy policy text, built from agency data only.
 * Never add legal text by hand and never invent missing data (registration
 * or VAT numbers, names): a line without data is left out.
 */
import type { Agency } from './agency';
import { COUNTRY, type Country } from './format';
import { lang, type Lang } from './i18n';

export type LegalRow = { label: string; value: string; href?: string };
export type LegalSection = { heading: string; rows?: LegalRow[]; paragraphs?: string[] };

type L = Record<Lang, string>;
const pick = (s: L, l: Lang) => s[l];

const REG_LABEL: Record<Country, L> = {
  CH: { de: 'UID', fr: 'IDE', it: 'IDI', es: 'UID', en: 'UID' },
  FR: { de: 'SIREN/SIRET', fr: 'SIREN/SIRET', it: 'SIREN/SIRET', es: 'SIREN/SIRET', en: 'SIREN/SIRET' },
  IT: { de: 'REA', fr: 'REA', it: 'REA', es: 'REA', en: 'REA' },
  ES: { de: 'NIF/CIF', fr: 'NIF/CIF', it: 'NIF/CIF', es: 'NIF/CIF', en: 'NIF/CIF' },
};
const VAT_LABEL: Record<Country, L> = {
  CH: { de: 'MWST-Nr.', fr: 'N° TVA', it: 'N. IVA', es: 'N.º IVA', en: 'VAT no.' },
  FR: { de: 'USt-IdNr.', fr: 'N° TVA intracommunautaire', it: 'Partita IVA', es: 'N.º IVA', en: 'VAT no.' },
  IT: { de: 'USt-IdNr.', fr: 'N° TVA', it: 'P.IVA', es: 'N.º IVA', en: 'VAT no.' },
  ES: { de: 'USt-IdNr.', fr: 'N° TVA', it: 'Partita IVA', es: 'NIF-IVA', en: 'VAT no.' },
};
const LAW: Record<Country, L> = {
  CH: {
    de: 'Schweizer Datenschutzgesetz (DSG)',
    fr: 'loi fédérale sur la protection des données (LPD)',
    it: 'legge federale sulla protezione dei dati (LPD)',
    es: 'Ley federal suiza de protección de datos (LPD)',
    en: 'Swiss Federal Act on Data Protection (FADP)',
  },
  FR: GDPR(), IT: GDPR(), ES: GDPR(),
};
function GDPR(): L {
  return {
    de: 'Datenschutz-Grundverordnung (DSGVO)',
    fr: 'règlement général sur la protection des données (RGPD)',
    it: 'regolamento generale sulla protezione dei dati (GDPR)',
    es: 'Reglamento General de Protección de Datos (RGPD)',
    en: 'General Data Protection Regulation (GDPR)',
  };
}

const W = {
  company: { de: 'Unternehmen', fr: 'Éditeur du site', it: 'Titolare del sito', es: 'Titular del sitio', en: 'Site owner' },
  name: { de: 'Firma', fr: 'Raison sociale', it: 'Ragione sociale', es: 'Razón social', en: 'Company' },
  address: { de: 'Adresse', fr: 'Adresse', it: 'Indirizzo', es: 'Dirección', en: 'Address' },
  phone: { de: 'Telefon', fr: 'Téléphone', it: 'Telefono', es: 'Teléfono', en: 'Phone' },
  email: { de: 'E-Mail', fr: 'E-mail', it: 'E-mail', es: 'Correo electrónico', en: 'Email' },
  card: { de: 'Berufsausweis', fr: 'Carte professionnelle', it: 'Tesserino professionale', es: 'Licencia profesional', en: 'Professional card' },
  rep: { de: 'Verantwortlich für den Inhalt', fr: 'Directeur de la publication', it: 'Responsabile dei contenuti', es: 'Responsable del contenido', en: 'Responsible for content' },
  hosting: { de: 'Hosting', fr: 'Hébergeur', it: 'Hosting', es: 'Alojamiento', en: 'Hosting' },
  controller: { de: 'Verantwortliche Stelle', fr: 'Responsable du traitement', it: 'Titolare del trattamento', es: 'Responsable del tratamiento', en: 'Data controller' },
  data: { de: 'Welche Daten wir bearbeiten', fr: 'Données traitées', it: 'Dati trattati', es: 'Datos tratados', en: 'Data we process' },
  dataText: {
    de: 'Wenn Sie uns über ein Formular kontaktieren, bearbeiten wir Ihren Namen, Ihre E-Mail-Adresse, Ihre Telefonnummer (falls angegeben), Ihre Nachricht und das betreffende Objekt, um Ihre Anfrage zu beantworten.',
    fr: 'Lorsque vous nous contactez via un formulaire, nous traitons votre nom, votre adresse e-mail, votre téléphone (si indiqué), votre message et le bien concerné, afin de répondre à votre demande.',
    it: 'Quando ci contatta tramite un modulo, trattiamo nome, indirizzo e-mail, telefono (se indicato), messaggio e immobile interessato, per rispondere alla sua richiesta.',
    es: 'Cuando nos contacta mediante un formulario, tratamos su nombre, correo electrónico, teléfono (si lo indica), su mensaje y el inmueble correspondiente para responder a su solicitud.',
    en: 'When you contact us through a form, we process your name, email address, phone number (if given), your message and the property concerned, to answer your enquiry.',
  },
  processors: { de: 'Dienstleister', fr: 'Sous-traitants', it: 'Responsabili del trattamento', es: 'Encargados del tratamiento', en: 'Service providers' },
  crm: {
    de: 'Anfragen werden in unserem Kundenverwaltungssystem RealAdvisor gespeichert.',
    fr: 'Les demandes sont enregistrées dans notre logiciel de gestion clients RealAdvisor.',
    it: 'Le richieste sono registrate nel nostro software di gestione clienti RealAdvisor.',
    es: 'Las solicitudes se registran en nuestro software de gestión de clientes RealAdvisor.',
    en: 'Enquiries are stored in our customer management software, RealAdvisor.',
  },
  host: {
    de: 'Die Website wird von Cloudflare, Inc. betrieben, das für die Auslieferung technische Daten wie die IP-Adresse bearbeitet.',
    fr: "Le site est hébergé par Cloudflare, Inc., qui traite des données techniques comme l'adresse IP pour afficher les pages.",
    it: "Il sito è ospitato da Cloudflare, Inc., che tratta dati tecnici come l'indirizzo IP per mostrare le pagine.",
    es: 'El sitio está alojado por Cloudflare, Inc., que trata datos técnicos como la dirección IP para mostrar las páginas.',
    en: 'The site is hosted by Cloudflare, Inc., which processes technical data such as the IP address to serve the pages.',
  },
  analytics: {
    de: 'Nur mit Ihrer Einwilligung messen wir die Nutzung der Website mit Google Analytics. Sie können die Einwilligung jederzeit widerrufen, indem Sie die Cookies dieser Website löschen.',
    fr: "Uniquement avec votre consentement, nous mesurons l'utilisation du site avec Google Analytics. Vous pouvez retirer votre consentement à tout moment en supprimant les cookies de ce site.",
    it: "Solo con il suo consenso misuriamo l'uso del sito con Google Analytics. Può revocare il consenso in qualsiasi momento cancellando i cookie di questo sito.",
    es: 'Solo con su consentimiento medimos el uso del sitio con Google Analytics. Puede retirar su consentimiento en cualquier momento borrando las cookies de este sitio.',
    en: 'Only with your consent do we measure site usage with Google Analytics. You can withdraw consent at any time by deleting this site’s cookies.',
  },
  noAnalytics: {
    de: 'Diese Website verwendet keine Analyse- oder Werbe-Cookies.',
    fr: "Ce site n'utilise pas de cookies d'analyse ni de publicité.",
    it: 'Questo sito non utilizza cookie analitici o pubblicitari.',
    es: 'Este sitio no utiliza cookies analíticas ni publicitarias.',
    en: 'This site uses no analytics or advertising cookies.',
  },
  rights: { de: 'Ihre Rechte', fr: 'Vos droits', it: 'I suoi diritti', es: 'Sus derechos', en: 'Your rights' },
  rightsText: {
    de: 'Gemäss {law} können Sie Auskunft über Ihre Daten verlangen sowie deren Berichtigung oder Löschung. Schreiben Sie uns dazu an die oben genannte Adresse.',
    fr: 'Conformément à la {law}, vous pouvez demander l’accès à vos données, leur rectification ou leur effacement. Écrivez-nous à l’adresse ci-dessus.',
    it: 'Ai sensi della {law} può chiedere l’accesso ai suoi dati, la rettifica o la cancellazione. Ci scriva all’indirizzo indicato sopra.',
    es: 'Conforme al {law}, puede solicitar el acceso a sus datos, su rectificación o su supresión. Escríbanos a la dirección indicada arriba.',
    en: 'Under the {law}, you can ask to access, correct or delete your data. Write to us at the address above.',
  },
} satisfies Record<string, L>;

const addressLine = (a: Agency) =>
  [a.address?.street, [a.address?.postcode, a.address?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');

function identity(a: Agency, l: Lang, country: Country): LegalRow[] {
  const rows: (LegalRow | false | undefined)[] = [
    { label: pick(W.name, l), value: a.legal?.company_name ?? a.name },
    !!addressLine(a) && { label: pick(W.address, l), value: addressLine(a) },
    !!a.phone && { label: pick(W.phone, l), value: a.phone!, href: `tel:${a.phone!.replace(/\s+/g, '')}` },
    !!a.email && { label: pick(W.email, l), value: a.email!, href: `mailto:${a.email}` },
    !!a.legal?.registration_number && { label: pick(REG_LABEL[country], l), value: a.legal!.registration_number! },
    !!a.legal?.vat_number && { label: pick(VAT_LABEL[country], l), value: a.legal!.vat_number! },
    !!a.legal?.professional_card && { label: pick(W.card, l), value: a.legal!.professional_card! },
    !!a.legal?.representative && { label: pick(W.rep, l), value: a.legal!.representative! },
  ];
  return rows.filter((r): r is LegalRow => !!r);
}

export function legalNotice(a: Agency, l: Lang = lang(), country: Country = COUNTRY): LegalSection[] {
  return [
    { heading: pick(W.company, l), rows: identity(a, l, country) },
    {
      heading: pick(W.hosting, l),
      paragraphs: ['Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA'],
    },
  ];
}

export function privacyPolicy(
  a: Agency,
  o: { analytics: boolean },
  l: Lang = lang(),
  country: Country = COUNTRY,
): LegalSection[] {
  return [
    { heading: pick(W.controller, l), rows: identity(a, l, country).filter((r) => r.label !== pick(W.rep, l)) },
    { heading: pick(W.data, l), paragraphs: [pick(W.dataText, l)] },
    {
      heading: pick(W.processors, l),
      paragraphs: [pick(W.crm, l), pick(W.host, l)],
    },
    { heading: 'Cookies', paragraphs: [o.analytics ? pick(W.analytics, l) : pick(W.noAnalytics, l)] },
    { heading: pick(W.rights, l), paragraphs: [pick(W.rightsText, l).replace('{law}', pick(LAW[country], l))] },
  ];
}
