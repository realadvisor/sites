/**
 * Journal posts: the site's own content (not API data), written for this
 * example in English and French. Plain, practical notes; no figures that the
 * data does not carry, no quotes. `author` is matched to an agent by e-mail
 * at render time and left out when no agent matches (live data).
 */
import type { L } from '../lib/routes';

type Block = { h?: string; p?: string; list?: string[] };
export type Post = {
  slug: string;
  date: string;
  /** Office slug the post is about (destination link). */
  place: string;
  author?: string;
  cover: { url: string; alt: Record<L, string> };
  title: Record<L, string>;
  summary: Record<L, string>;
  body: Record<L, Block[]>;
};

const B = 'https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-';

export const POSTS: Post[] = [
  {
    slug: 'second-homes-saanenland',
    date: '2026-10-20',
    place: 'gstaad',
    author: 'ines.kohler@clairval.example.com',
    cover: { url: `${B}30785212.jpg`, alt: { en: 'Chalets on the Gstaad Promenade', fr: 'Chalets sur la Promenade de Gstaad' } },
    title: {
      en: 'Buying a holiday chalet in the Saanenland from abroad',
      fr: 'Acheter un chalet de vacances au Saanenland depuis l’étranger',
    },
    summary: {
      en: 'Two federal laws decide whether a chalet in Gstaad can be your holiday home. What to check before an offer.',
      fr: 'Deux lois fédérales décident si un chalet à Gstaad peut devenir votre résidence de vacances. Ce qu’il faut vérifier avant une offre.',
    },
    body: {
      en: [
        { p: 'Two federal laws matter when a buyer who lives outside Switzerland looks at a chalet in Gstaad, Saanen or Schönried. The first decides whether you may buy at all, the second whether the house may be used as a second home.' },
        { h: 'The permit to buy', p: 'Under the Federal Act on the Acquisition of Real Estate by Persons Abroad (the Lex Koller), a buyer who does not live in Switzerland needs a cantonal permit to buy a holiday home. Permits are given in designated tourist communes, within a yearly quota. Swiss citizens, and EU and EFTA citizens who live in Switzerland, do not need one.' },
        { h: 'Second homes', p: 'Since the Second Homes Act came into force in 2016, communes where second homes already make up more than a fifth of all homes may not allow new ones. Saanen is one of them. Homes that existed lawfully before 11 March 2012 can in general still be sold and used as second homes; many newer chalets may only be lived in as a main residence.' },
        { h: 'What we check for you', list: [
          'The land register extract, including any note that restricts the use to a main residence.',
          'The year of the building permit and of later extensions.',
          'Whether a permit under the Lex Koller is needed and how the canton handles the quota.',
          'The notary’s estimate of the transfer tax and fees in the Canton of Bern.',
        ] },
        { p: 'We prepare this file before a second visit, so an offer is made on a house you can actually use the way you plan to.' },
      ],
      fr: [
        { p: 'Deux lois fédérales comptent lorsqu’un acheteur qui vit hors de Suisse s’intéresse à un chalet à Gstaad, à Saanen ou à Schönried. La première dit s’il peut acheter, la seconde si la maison peut servir de résidence secondaire.' },
        { h: 'L’autorisation d’acquérir', p: 'Selon la loi fédérale sur l’acquisition d’immeubles par des personnes à l’étranger (la Lex Koller), un acheteur qui ne vit pas en Suisse a besoin d’une autorisation cantonale pour acheter une résidence de vacances. Les autorisations sont accordées dans des communes touristiques désignées, dans la limite d’un contingent annuel. Les citoyens suisses, et les citoyens de l’UE et de l’AELE domiciliés en Suisse, n’en ont pas besoin.' },
        { h: 'Les résidences secondaires', p: 'Depuis l’entrée en vigueur de la loi sur les résidences secondaires en 2016, les communes où les résidences secondaires dépassent déjà un cinquième des logements ne peuvent plus en autoriser de nouvelles. Saanen en fait partie. Les logements qui existaient légalement avant le 11 mars 2012 peuvent en général toujours être vendus et utilisés comme résidences secondaires ; beaucoup de chalets plus récents ne peuvent être habités qu’à titre de résidence principale.' },
        { h: 'Ce que nous vérifions pour vous', list: [
          'L’extrait du registre foncier, y compris une éventuelle mention qui limite l’usage à une résidence principale.',
          'L’année du permis de construire et des agrandissements.',
          'La nécessité d’une autorisation Lex Koller et la façon dont le canton gère le contingent.',
          'L’estimation par le notaire de l’impôt sur les mutations et des frais dans le canton de Berne.',
        ] },
        { p: 'Nous préparons ce dossier avant une deuxième visite, pour qu’une offre porte sur une maison que vous pourrez utiliser comme vous le prévoyez.' },
      ],
    },
  },
  {
    slug: 'summer-rental-saint-tropez',
    date: '2026-09-28',
    place: 'saint-tropez',
    author: 'thomas.giraud@clairval.example.com',
    cover: { url: `${B}29851512.jpg`, alt: { en: 'The harbour of Saint-Tropez', fr: 'Le port de Saint-Tropez' } },
    title: {
      en: 'Renting a villa for the summer on the Saint-Tropez peninsula',
      fr: 'Louer une villa pour l’été sur la presqu’île de Saint-Tropez',
    },
    summary: {
      en: 'How a seasonal let in Ramatuelle or Gassin works, from the first enquiry to the inventory on departure.',
      fr: 'Comment se passe une location saisonnière à Ramatuelle ou à Gassin, de la première demande à l’état des lieux de sortie.',
    },
    body: {
      en: [
        { p: 'Most of the villas we let on the peninsula are let by the month, in June, July or August. Owners usually decide on the summer during the winter, so the first enquiries for July and August come early in the year.' },
        { h: 'The contract', p: 'A summer let is a seasonal rental of a furnished house under French law, for a fixed period. The contract states the dates, the rent, what is included (housekeeping, linen, pool and garden care, concierge) and the number of guests.' },
        { h: 'Payments', list: [
          'A first payment when the contract is signed, the balance before arrival.',
          'A security deposit, returned after the inventory on departure.',
          'The tourist tax, set by the commune per person and per night and collected with the rent.',
        ] },
        { h: 'Arrival and departure', p: 'One of us meets you at the house, walks through the inventory and shows the pool, alarm and garden. On the last day the inventory is done again; the deposit is returned once nothing is missing or damaged.' },
        { p: 'Our current summer rentals are on the rent page, with the months they are available.' },
      ],
      fr: [
        { p: 'La plupart des villas que nous louons sur la presqu’île se louent au mois, en juin, juillet ou août. Les propriétaires décident généralement de leur été pendant l’hiver ; les premières demandes pour juillet et août arrivent donc tôt dans l’année.' },
        { h: 'Le contrat', p: 'Une location d’été est une location saisonnière d’une maison meublée selon le droit français, pour une durée fixe. Le contrat indique les dates, le loyer, ce qui est compris (ménage, linge, entretien de la piscine et du jardin, conciergerie) et le nombre d’occupants.' },
        { h: 'Les paiements', list: [
          'Un premier versement à la signature du contrat, le solde avant l’arrivée.',
          'Un dépôt de garantie, rendu après l’état des lieux de sortie.',
          'La taxe de séjour, fixée par la commune par personne et par nuit et perçue avec le loyer.',
        ] },
        { h: 'Arrivée et départ', p: 'L’un de nous vous accueille à la maison, fait l’état des lieux et vous montre la piscine, l’alarme et le jardin. Le dernier jour, l’état des lieux est refait ; le dépôt est rendu si rien ne manque ni n’est abîmé.' },
        { p: 'Nos locations d’été en cours sont sur la page Louer, avec les mois où elles sont disponibles.' },
      ],
    },
  },
  {
    slug: 'selling-a-house-in-geneva',
    date: '2026-09-02',
    place: 'geneva',
    author: 'julien.favre@clairval.example.com',
    cover: { url: `${B}34391321.jpg`, alt: { en: 'A street in the old town of Geneva', fr: 'Une rue de la vieille ville de Genève' } },
    title: {
      en: 'Selling a house in Geneva: the documents to have ready',
      fr: 'Vendre une maison à Genève : les documents à préparer',
    },
    summary: {
      en: 'A short list of what a buyer, their bank and the notary will ask for, and why it is worth gathering before the first viewing.',
      fr: 'La liste de ce que l’acheteur, sa banque et le notaire demanderont, et pourquoi il vaut la peine de la réunir avant la première visite.',
    },
    body: {
      en: [
        { p: 'A serious buyer asks for the same documents in the first week, and so does their bank. Having them ready shortens the time between a visit and a signed deed, and avoids a price discussion late in the sale.' },
        { h: 'The house', list: [
          'The land register extract and the cadastral plan.',
          'The building plans, and the permits for any extension, pool or outbuilding.',
          'A list of the main works since you bought, with the invoices.',
          'The heating system, its age and the last service report; an energy certificate (CECB) if you have one.',
        ] },
        { h: 'An apartment in a building (PPE)', list: [
          'The co-ownership rules and the share of your unit.',
          'The minutes of the last three general meetings.',
          'The balance of the renovation fund and the works planned.',
        ] },
        { h: 'The sale', p: 'In Geneva the deed is signed before a notary, who also registers the transfer. We agree with you who chooses the notary, and send them the file when the buyer’s financing is confirmed.' },
      ],
      fr: [
        { p: 'Un acheteur sérieux demande les mêmes documents dès la première semaine, et sa banque aussi. Les avoir prêts raccourcit le temps entre une visite et un acte signé, et évite une discussion sur le prix en fin de vente.' },
        { h: 'La maison', list: [
          'L’extrait du registre foncier et le plan cadastral.',
          'Les plans de la maison, et les autorisations pour un agrandissement, une piscine ou une dépendance.',
          'La liste des principaux travaux depuis votre achat, avec les factures.',
          'Le chauffage, son âge et le dernier rapport d’entretien ; un certificat énergétique (CECB) si vous en avez un.',
        ] },
        { h: 'Un appartement en PPE', list: [
          'Le règlement de copropriété et la quote-part de votre lot.',
          'Les procès-verbaux des trois dernières assemblées générales.',
          'Le solde du fonds de rénovation et les travaux prévus.',
        ] },
        { h: 'La vente', p: 'À Genève, l’acte est signé devant notaire, qui inscrit aussi le transfert au registre foncier. Nous convenons avec vous du choix du notaire et lui transmettons le dossier dès que le financement de l’acheteur est confirmé.' },
      ],
    },
  },
];

export const findPost = (slug: string) => POSTS.find((p) => p.slug === slug) ?? null;
