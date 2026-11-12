/**
 * One floor of one wing drawn as a plate: a rectangle per unit, in its order
 * on the floor (fixture only: position, sorted by the loader), its width
 * following its living area on a scale shared by every floor of the wing,
 * filled by status. The stairs sit after the first unit; what is left of the
 * plate is common area. Each unit is a link to its page. A diagram, not a
 * plan: the page says so.
 */
import { tr, type Lang } from '../lib/i18n';
import type { UnitRow, Wing } from '../lib/units.server';
import './FloorPlate.css';

type Props = {
  /** The floor's units, already in their order on the floor. */
  units: UnitRow[];
  lang: Lang;
  wing: Wing;
  /** Largest floor area of the wing (m²): the shared scale. */
  scaleArea: number;
  selected?: string;
  /** Compact version (unit page): no street labels. */
  compact?: boolean;
  label: string;
};

type Box = { u?: UnitRow; x: number; w: number; core?: boolean };

export function FloorPlate({ units: row, lang, wing, scaleArea, selected, compact = false, label }: Props) {
  const t = tr(lang);
  const W = 1000;
  const X0 = 30;
  const Y0 = compact ? 16 : 52;
  const H = compact ? 150 : 300;
  const CORE = 64;
  const inner = W - 2 * X0 - CORE;
  const k = inner / scaleArea;
  const boxes: Box[] = [];
  let x = X0;
  row.forEach((u, i) => {
    const w = Math.max(92, (u.living ?? 40) * k);
    boxes.push({ u, x, w });
    x += w;
    if (i === 0 && row.length > 1) { boxes.push({ x, w: CORE, core: true }); x += CORE; }
  });
  if (row.length <= 1) { boxes.push({ x, w: CORE, core: true }); x += CORE; }
  const end = W - X0;
  const common = end - x > 8 ? { x, w: end - x } : null;
  const H2 = Y0 + H;
  const vbH = H2 + (compact ? 16 : 48);
  const hatch = `hatch-${wing}-${compact ? 'c' : 'f'}-${row[0]?.floor ?? 0}`;
  return (
    <svg className={['plate', compact && 'compact'].filter(Boolean).join(' ')} viewBox={`0 0 ${W} ${vbH}`} role="group" aria-label={label}>
      <defs>
        <pattern id={hatch} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="10" fill="#f2ece3" /><path d="M0 0v10" stroke="#ddd3c5" strokeWidth="3" />
        </pattern>
      </defs>
      {!compact && <text x={W / 2} y="30" className="side">{wing === '1908' ? t.courtyard : t.wings['1908']}</text>}
      {!compact && <text x={W / 2} y={H2 + 34} className="side">{wing === '1908' ? t.street : t.courtyard}</text>}
      <rect x={X0} y={Y0} width={end - X0} height={H} className="shell" />
      {common && <rect x={common.x} y={Y0} width={common.w} height={H} fill={`url(#${hatch})`} className="common" />}
      {boxes.map((b, i) =>
        b.core ? (
          <g className="core" key={`core-${i}`}>
            <rect x={b.x} y={Y0} width={b.w} height={H} />
            {Array.from({ length: 7 }, (_, j) => <line key={j} x1={b.x + 10} x2={b.x + b.w - 10} y1={Y0 + 20 + j * ((H - 40) / 6)} y2={Y0 + 20 + j * ((H - 40) / 6)} />)}
            {!compact && <text x={b.x + b.w / 2} y={Y0 + H / 2} transform={`rotate(-90 ${b.x + b.w / 2} ${Y0 + H / 2})`} className="core-t">{t.core}</text>}
          </g>
        ) : (
          <a key={b.u!.id} href={b.u!.href} className={['u', b.u!.status, b.u!.id === selected && 'sel'].filter(Boolean).join(' ')} data-unit={b.u!.id}
            aria-label={`${b.u!.number ? `${t.unit} ${b.u!.number}, ` : ''}${b.u!.title}, ${b.u!.living ?? ''} m², ${b.u!.statusLabel}`}>
            <rect x={b.x + 3} y={Y0 + 3} width={b.w - 6} height={H - 6} rx="2" />
            <text x={b.x + 16} y={Y0 + (compact ? 40 : 66)} className="no">{b.u!.number}</text>
            {!compact && <text x={b.x + 16} y={Y0 + 104} className="kd">{b.u!.short}</text>}
            {!compact && <text x={b.x + 16} y={Y0 + 130} className="sz">{b.u!.living} m²</text>}
            <text x={b.x + 16} y={Y0 + H - (compact ? 18 : 22)} className="st">{b.u!.statusLabel}</text>
          </a>
        ),
      )}
      {common && !compact && common.w > 120 && <text x={common.x + common.w / 2} y={Y0 + H / 2 + 6} className="cm">{lang === 'es' ? 'Zonas comunes' : 'Common areas'}</text>}
    </svg>
  );
}
