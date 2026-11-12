/**
 * Site content (not API data): photos and a short, factual introduction per
 * destination, keyed by the office slug (src/lib/routes.ts teamSlug). Photos
 * are from the RealAdvisor bucket (Pexels, see photo-credits.md)
 * and render through RaImage. A destination without an entry here falls back
 * to its listings' photos and no introduction.
 */
import type { L } from '../lib/routes';

type Text = Record<L, string>;
export type PlacePhoto = { url: string; alt: Text };
export type Place = {
  photos: PlacePhoto[];
  /** One plain sentence for cards. */
  line: Text;
  /** Two or three short paragraphs for the destination page. */
  intro: Record<L, string[]>;
  /** Practical facts: label and value. */
  facts: Record<L, [string, string][]>;
};

const B = 'https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-';

export const PLACES: Record<string, Place> = {
  geneva: {
    photos: [
      { url: `${B}36343876.jpg`, alt: { en: 'Geneva and the lake with the Alps behind', fr: 'Genève et le lac, les Alpes en arrière-plan' } },
      { url: `${B}36700766.jpg`, alt: { en: 'The Jet d’eau in Geneva with a rainbow', fr: 'Le jet d’eau de Genève et un arc-en-ciel' } },
      { url: `${B}32980061.jpg`, alt: { en: 'A footpath along the shore of Lake Geneva', fr: 'Un chemin au bord du Léman' } },
      { url: `${B}34391321.jpg`, alt: { en: 'A street in the old town of Geneva', fr: 'Une rue de la vieille ville de Genève' } },
      { url: `${B}36102053.jpg`, alt: { en: 'The Geneva quays at sunset', fr: 'Les quais de Genève au coucher du soleil' } },
      { url: `${B}34391340.jpg`, alt: { en: 'The Brunswick monument and the Jet d’eau', fr: 'Le monument Brunswick et le jet d’eau' } },
    ],
    line: {
      en: 'Lakeside houses on the left bank and apartments in Champel and Florissant.',
      fr: 'Maisons au bord du lac sur la rive gauche, appartements à Champel et Florissant.',
    },
    intro: {
      en: [
        'Most of our Geneva houses are on the left bank of the lake, from Cologny to Anières: properties with lake frontage and a jetty in Collonge-Bellerive, larger plots in Vandœuvres and Chêne-Bougeries. In town we sell and let apartments in Champel and Florissant, close to the Léman Express.',
        'The office is in the old town, on the Rue de la Corraterie. Viewings are arranged with the owner’s agreement; many houses are not photographed from the street and their address is given on request.',
      ],
      fr: [
        'La plupart de nos maisons genevoises sont sur la rive gauche du lac, de Cologny à Anières : propriétés pieds dans l’eau avec ponton à Collonge-Bellerive, grandes parcelles à Vandœuvres et à Chêne-Bougeries. En ville, nous vendons et louons des appartements à Champel et à Florissant, près du Léman Express.',
        'Le bureau est en vieille ville, rue de la Corraterie. Les visites se font avec l’accord du propriétaire ; beaucoup de maisons ne sont pas photographiées depuis la rue et leur adresse est donnée sur demande.',
      ],
    },
    facts: {
      en: [['Canton', 'Geneva'], ['Communes', 'Cologny, Vandœuvres, Collonge-Bellerive, Anières, Chêne-Bougeries, Geneva'], ['Airport', 'Geneva Airport']],
      fr: [['Canton', 'Genève'], ['Communes', 'Cologny, Vandœuvres, Collonge-Bellerive, Anières, Chêne-Bougeries, Genève'], ['Aéroport', 'Genève Aéroport']],
    },
  },
  gstaad: {
    photos: [
      { url: `${B}30785211.jpg`, alt: { en: 'Chalets on the Gstaad Promenade', fr: 'Chalets sur la Promenade de Gstaad' } },
      { url: `${B}30785212.jpg`, alt: { en: 'Shops in chalets on the Gstaad Promenade', fr: 'Boutiques dans les chalets de la Promenade de Gstaad' } },
      { url: `${B}30888242.jpg`, alt: { en: 'A chalet on the Gstaad Promenade', fr: 'Un chalet sur la Promenade de Gstaad' } },
      { url: `${B}30785213.jpg`, alt: { en: 'A street in Gstaad with the chapel', fr: 'Une rue de Gstaad et la chapelle' } },
      { url: `${B}30888241.jpg`, alt: { en: 'The village street of Saanen in autumn', fr: 'La rue du village de Saanen en automne' } },
      { url: `${B}30888243.jpg`, alt: { en: 'A chalet and shops in Saanen', fr: 'Un chalet et des boutiques à Saanen' } },
    ],
    line: {
      en: 'Chalets in Gstaad, Saanen, Schönried and Lauenen, and furnished winter rentals.',
      fr: 'Chalets à Gstaad, Saanen, Schönried et Lauenen, et locations meublées pour l’hiver.',
    },
    intro: {
      en: [
        'The Saanenland is the valley around Gstaad in the Bernese Oberland: Gstaad itself, Saanen, Schönried, Saanenmöser and Lauenen. Most houses are chalets in wood and stone; the sunny slopes above the Promenade, such as the Oberbort and the Wispile side, are the most asked for.',
        'Buyers who do not live in Switzerland need a permit to buy a holiday home, and new second homes are limited in the commune. Our journal explains what this means before you visit.',
      ],
      fr: [
        'Le Saanenland est la vallée autour de Gstaad, dans l’Oberland bernois : Gstaad, Saanen, Schönried, Saanenmöser et Lauenen. La plupart des maisons sont des chalets en bois et en pierre ; les coteaux ensoleillés au-dessus de la Promenade, comme l’Oberbort et le versant du Wispile, sont les plus demandés.',
        'Les acheteurs qui ne vivent pas en Suisse ont besoin d’une autorisation pour acquérir une résidence secondaire, et les nouvelles résidences secondaires sont limitées dans la commune. Notre journal explique ce que cela implique avant une visite.',
      ],
    },
    facts: {
      en: [['Canton', 'Bern'], ['Villages', 'Gstaad, Saanen, Schönried, Saanenmöser, Lauenen'], ['By car from Geneva', 'about 2 hours']],
      fr: [['Canton', 'Berne'], ['Villages', 'Gstaad, Saanen, Schönried, Saanenmöser, Lauenen'], ['En voiture depuis Genève', 'environ 2 heures']],
    },
  },
  'saint-tropez': {
    photos: [
      { url: `${B}6931306.jpg`, alt: { en: 'Saint-Tropez old town and the bay from the hill', fr: 'La vieille ville de Saint-Tropez et la baie depuis la colline' } },
      { url: `${B}29851512.jpg`, alt: { en: 'The harbour of Saint-Tropez with the quay houses', fr: 'Le port de Saint-Tropez et les maisons du quai' } },
      { url: `${B}6931319.jpg`, alt: { en: 'The harbour of Saint-Tropez through the pines', fr: 'Le port de Saint-Tropez à travers les pins' } },
      { url: `${B}29851526.jpg`, alt: { en: 'Houses on the Saint-Tropez waterfront', fr: 'Maisons du front de mer de Saint-Tropez' } },
    ],
    line: {
      en: 'Villas and bastides in Saint-Tropez, Ramatuelle and Gassin, and summer rentals.',
      fr: 'Villas et bastides à Saint-Tropez, Ramatuelle et Gassin, et locations d’été.',
    },
    intro: {
      en: [
        'The Saint-Tropez peninsula covers three communes: Saint-Tropez, with the village houses and Les Salins; Ramatuelle, with the Pampelonne beaches, Tahiti and Bonne Terrasse; and Gassin, on the hill between the two, near the golf course.',
        'We sell villas and bastides all year and let a small number of houses for the summer months. Prices on the peninsula are in euros.',
      ],
      fr: [
        'La presqu’île de Saint-Tropez compte trois communes : Saint-Tropez, avec les maisons de village et Les Salins ; Ramatuelle, avec les plages de Pampelonne, Tahiti et Bonne Terrasse ; et Gassin, sur la colline entre les deux, près du golf.',
        'Nous vendons des villas et des bastides toute l’année et louons quelques maisons pour les mois d’été. Les prix sur la presqu’île sont en euros.',
      ],
    },
    facts: {
      en: [['Department', 'Var, France'], ['Communes', 'Saint-Tropez, Ramatuelle, Gassin'], ['Currency', 'EUR']],
      fr: [['Département', 'Var, France'], ['Communes', 'Saint-Tropez, Ramatuelle, Gassin'], ['Monnaie', 'EUR']],
    },
  },
};

export const placeOf = (slug: string): Place | undefined => PLACES[slug];
