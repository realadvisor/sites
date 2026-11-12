/**
 * Legal sections from the kit's lib/legal.ts (port of LegalContent.astro).
 * Never edit the words: they come from the agency data only.
 *
 *   <LegalContent sections={legalNotice(agencyOf(org, team))} />
 */
import type { LegalSection } from '@realadvisor/sites-kit-core/legal';

export function LegalContent({ sections, className }: { sections: LegalSection[]; className?: string }) {
  return (
    <div className={['legal', className].filter(Boolean).join(' ')}>
      {sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          {s.rows && (
            <dl>
              {s.rows.map((r, j) => (
                <div key={j}>
                  <dt>{r.label}</dt>
                  <dd>{r.href ? <a href={r.href}>{r.value}</a> : r.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {s.paragraphs?.map((p, j) => <p key={j}>{p}</p>)}
        </section>
      ))}
    </div>
  );
}
