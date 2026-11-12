/**
 * About text, written for this site (not API data, fictional). Facts and
 * figures on the page are computed from the data; this text carries none.
 */
import type { L } from '../lib/routes';

export const ABOUT: Record<L, { h: string; p: string }[]> = {
  de: [
    { h: 'Was wir machen', p: 'Wir verkaufen und vermieten Wohnungen und Häuser für private Eigentümerinnen und Eigentümer. Dazu kommt der Verkauf von Neubauwohnungen im Auftrag von Bauherrschaften, vom Plan bis zur Übergabe der Schlüssel.' },
    { h: 'Wie wir arbeiten', p: 'Jedes Objekt betreut der Standort in seiner Region, mit einer festen Ansprechperson von der Bewertung bis zur Beurkundung. Wer kauft oder mietet, spricht mit derselben Person wie die Eigentümerschaft und erhält die Unterlagen direkt von ihr.' },
    { h: 'Bewertungen', p: 'Eine Bewertung beginnt mit einer Besichtigung. Wir begründen den vorgeschlagenen Preis schriftlich, mit Lage, Zustand und den Verkäufen, die wir selbst begleitet haben.' },
  ],
  fr: [
    { h: 'Ce que nous faisons', p: 'Nous vendons et louons des appartements et des maisons pour des propriétaires privés. Nous vendons aussi des logements neufs pour le compte de maîtres d’ouvrage, du plan à la remise des clés.' },
    { h: 'Notre façon de travailler', p: 'Chaque bien est suivi par le bureau de sa région, avec un seul conseiller de l’estimation à l’acte notarié. Acheteurs et locataires parlent à la même personne que le propriétaire et reçoivent le dossier directement d’elle.' },
    { h: 'Estimations', p: 'Une estimation commence par une visite. Nous justifions le prix proposé par écrit : situation, état et ventes que nous avons nous-mêmes menées.' },
  ],
  en: [
    { h: 'What we do', p: 'We sell and let flats and houses for private owners. We also sell new-build flats on behalf of developers, from the plans to handing over the keys.' },
    { h: 'How we work', p: 'Every property is handled by the office for its region, with one adviser from the valuation to the notarial deed. Buyers and tenants talk to the same person as the owner and get the documents directly from them.' },
    { h: 'Valuations', p: 'A valuation starts with a visit. We explain the proposed price in writing: location, condition and the sales we have handled ourselves.' },
  ],
};
