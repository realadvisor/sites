/**
 * Place photos (Pexels, free licence) from the RealAdvisor image pool,
 * with French alt texts. Not API data: the site's own content. No photos
 * exist for Caluire-et-Cuire, Mérignac, Pessac, Le Bouscat or Caudéran:
 * their pages use the Lyon or Bordeaux sets (see placeFor).
 */
import type { Photo } from '@realadvisor/sites-sdk/types';

export const PLACES: Record<string, Photo[]> = {
 "lyon": [
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-34811176.jpg",
   "alt": "Les quais de Saône à l'automne, Lyon"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-4827690.jpg",
   "alt": "La passerelle Saint-Vincent sur la Saône, Lyon"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-6561248.jpg",
   "alt": "Façades des quais de Saône sous Fourvière, Lyon"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-16632276.jpg",
   "alt": "Immeubles lyonnais sous la basilique de Fourvière"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-12823618.jpg",
   "alt": "Les toits de Lyon vus du ciel"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-5773238.jpg",
   "alt": "La colline de Fourvière, Lyon"
  }
 ],
 "lyon-presquile": [
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-16156594.jpg",
   "alt": "Statue de Louis XIV place Bellecour, Fourvière au fond"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-8431150.jpg",
   "alt": "La place Bellecour vue du ciel"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-29513833.jpg",
   "alt": "La Presqu'île de Lyon vue du ciel"
  }
 ],
 "lyon-croix-rousse": [
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-35765496.jpg",
   "alt": "Lyon depuis un belvédère de la Croix-Rousse"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-31726772.jpg",
   "alt": "Rue ancienne de la Croix-Rousse"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-31726769.jpg",
   "alt": "Escalier de la Croix-Rousse"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-34057905.jpg",
   "alt": "Rue sur les pentes de la Croix-Rousse"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-19452303.jpg",
   "alt": "Immeubles anciens colorés, Lyon"
  }
 ],
 "villeurbanne": [
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-12067286.jpg",
   "alt": "Le Théâtre National Populaire, Villeurbanne"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-12067282.jpg",
   "alt": "Une tour des Gratte-Ciel, Villeurbanne"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-12067285.jpg",
   "alt": "Les tours des Gratte-Ciel, Villeurbanne"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-4097035.jpg",
   "alt": "L'hôtel de ville de Villeurbanne la nuit"
  }
 ],
 "bordeaux": [
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-36886170.jpg",
   "alt": "La place de la Bourse au coucher du soleil, Bordeaux"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-30732700.jpg",
   "alt": "Le pont de pierre, Bordeaux"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-37640873.jpg",
   "alt": "La cathédrale Saint-André, Bordeaux"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-9938007.jpg",
   "alt": "Les toits de Bordeaux et la flèche Saint-Michel"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-32399845.jpg",
   "alt": "Façades en pierre, Bordeaux"
  }
 ],
 "bordeaux-quais": [
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-30732702.jpg",
   "alt": "Jardins et façades en pierre sur les quais, Bordeaux"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-30732709.jpg",
   "alt": "Façades en pierre le long des quais de Bordeaux"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-5534656.jpg",
   "alt": "Lierre sur une façade en pierre de Bordeaux"
  },
  {
   "url": "https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels-38209448.jpg",
   "alt": "Rue en pierre à l'automne, Bordeaux"
  }
 ]
};

const NEAR: Record<string, string> = {
  lyon: 'lyon',
  villeurbanne: 'villeurbanne',
  'caluire-et-cuire': 'lyon-croix-rousse',
  bordeaux: 'bordeaux',
  merignac: 'bordeaux-quais',
  pessac: 'bordeaux-quais',
  'le-bouscat': 'bordeaux-quais',
  presquile: 'lyon-presquile',
  'croix-rousse': 'lyon-croix-rousse',
  chartrons: 'bordeaux-quais',
  cauderan: 'bordeaux',
};

/** Photos for a city or agency slug ([] when none). */
export const placeFor = (slug: string): Photo[] => PLACES[NEAR[slug] ?? slug] ?? [];
