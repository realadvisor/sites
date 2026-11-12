/**
 * Site photos (Pexels, see photo-credits.md), stored in the RealAdvisor image
 * bucket and served through imgproxy like every CRM photo. width/height are
 * the intrinsic size of the stored file.
 */
const B = 'https://storage.googleapis.com/img.realadvisor.ch/sites-demo-pexels';
export const PHOTOS = {
  'chantier-grues': { url: `${B}-5505119.jpg`, width: 2400, height: 1600 },
  'chantier-structure': { url: `${B}-7108779-c.jpg`, width: 2400, height: 3150 },
  'chantier-filets': { url: `${B}-35757191.jpg`, width: 2400, height: 3200 },
  'chantier-voiles-beton': { url: `${B}-35548971.jpg`, width: 2400, height: 1598 },
  'chantier-echafaudages': { url: `${B}-37520395.jpg`, width: 2400, height: 1800 },
  'chantier-finitions': { url: `${B}-38449886.jpg`, width: 2400, height: 1731 },
  'maison-crepuscule': { url: `${B}-4626268.jpg`, width: 2400, height: 1600 },
} as const;
export type PhotoName = keyof typeof PHOTOS;
