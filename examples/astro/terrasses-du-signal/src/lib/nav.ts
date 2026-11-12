/** Site navigation (French only: one language, routes without a prefix). */
export const NAV = [
  { href: '/appartements', label: 'Appartements' },
  { href: '/situation', label: 'Situation' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/documents', label: 'Documents' },
] as const;
export const CONTACT = { href: '/contact', label: 'Contact' } as const;
export const BROCHURE = '/documents/brochure-terrasses-du-signal.pdf';

/** tel: href from a displayed number. */
export const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
