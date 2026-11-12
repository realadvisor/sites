/** Sticky section bar of one programme: its pages and the enquiry. */
import { programmeUrl } from '../lib/fr';
import './ProgrammeNav.css';

export type NavProgramme = { slug: string; title: string; address: { city?: string } };

export function ProgrammeNav({ programme: d, section }: { programme: NavProgramme; section?: string }) {
  const items = [
    { key: 'home', href: programmeUrl(d), label: 'Présentation' },
    { key: 'units', href: programmeUrl(d, 'logements'), label: 'Logements' },
    { key: 'situation', href: programmeUrl(d, 'situation'), label: 'Situation' },
    { key: 'gallery', href: programmeUrl(d, 'galerie'), label: 'Galerie' },
    { key: 'documents', href: programmeUrl(d, 'documents'), label: 'Documents' },
  ];
  return (
    <nav className="pnav" aria-label={`${d.title} : sections`}>
      <div className="pn-inner">
        <a className="pn-name" href={programmeUrl(d)}>{d.title}<span>{d.address.city}</span></a>
        <ul>
          {items.map((i) => (
            <li key={i.key}><a href={i.href} aria-current={section === i.key ? 'page' : undefined}>{i.label}</a></li>
          ))}
        </ul>
        <a className="pn-cta" href={`${programmeUrl(d)}#contact`}>Être rappelé</a>
      </div>
    </nav>
  );
}
