/**
 * Site content written for this agency (not API data): the About text and
 * the sale process on Sell. Fictional, no figures: every number
 * on the site is computed from the data.
 */
import type { L } from '../lib/routes';

type Step = { title: string; text: string };

export const SELL_STEPS: Record<L, Step[]> = {
  fr: [
    { title: 'Estimer', text: 'Un conseiller du bureau de votre région visite le bien et vous remet une estimation argumentée, fondée sur les ventes comparables qu’il connaît.' },
    { title: 'Préparer', text: 'Photos, plans, descriptif et dossier technique : nous préparons une présentation complète avant la mise en vente.' },
    { title: 'Diffuser', text: 'Votre bien est présenté sur notre site, sur les portails et auprès des acheteurs suivis par nos bureaux.' },
    { title: 'Négocier', text: 'Nous organisons les visites, vérifions le financement des acheteurs et négocions en votre nom.' },
    { title: 'Signer', text: 'Nous coordonnons le notaire, la banque et la remise des clés jusqu’au dernier rendez-vous.' },
  ],
  de: [
    { title: 'Bewerten', text: 'Eine Beraterin oder ein Berater Ihrer Region besichtigt die Immobilie und erstellt eine begründete Bewertung auf Basis vergleichbarer Verkäufe.' },
    { title: 'Vorbereiten', text: 'Fotos, Grundrisse, Beschrieb und technisches Dossier: Wir bereiten eine vollständige Präsentation vor dem Verkaufsstart vor.' },
    { title: 'Vermarkten', text: 'Ihre Immobilie erscheint auf unserer Website, auf den Portalen und bei den Kaufinteressenten aller unserer Standorte.' },
    { title: 'Verhandeln', text: 'Wir organisieren die Besichtigungen, prüfen die Finanzierung der Interessenten und verhandeln in Ihrem Namen.' },
    { title: 'Abschliessen', text: 'Wir koordinieren Notariat, Bank und Schlüsselübergabe bis zum letzten Termin.' },
  ],
};

export const ABOUT: Record<L, { title: string; paragraphs: string[] }> = {
  fr: {
    title: 'Une agence née à Genève',
    paragraphs: [
      'Alder & Roux a ouvert son premier bureau à Genève. L’idée : un bien se vend et se loue mieux quand la personne qui le présente connaît la rue, l’immeuble et les acheteurs du quartier.',
      'Les bureaux de Lausanne et de Zurich ont suivi. Chaque équipe travaille son propre marché, avec les mêmes outils, le même soin des annonces et un fichier commun d’acheteurs et de locataires.',
      'Concrètement, un acheteur inscrit à Zurich qui cherche au bord du Léman reçoit aussi les biens de Genève et de Lausanne, et c’est le bureau du lieu qui organise la visite.',
    ],
  },
  de: {
    title: 'Eine Agentur aus Genf',
    paragraphs: [
      'Alder & Roux hat den ersten Standort in Genf eröffnet. Der Gedanke dahinter: Eine Immobilie verkauft und vermietet sich besser, wenn die Person, die sie anbietet, die Strasse, das Haus und die Käuferschaft im Quartier kennt.',
      'Die Standorte Lausanne und Zürich kamen später dazu. Jedes Team bearbeitet seinen eigenen Markt, mit denselben Werkzeugen, derselben Sorgfalt bei den Inseraten und einer gemeinsamen Kartei von Kauf- und Mietinteressenten.',
      'Wer zum Beispiel in Zürich als Käufer eingetragen ist und am Genfersee sucht, erhält auch die Objekte aus Genf und Lausanne. Die Besichtigung organisiert der Standort vor Ort.',
    ],
  },
};
