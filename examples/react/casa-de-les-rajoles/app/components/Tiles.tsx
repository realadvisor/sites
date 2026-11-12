/**
 * The hydraulic-tile motif of the building, drawn (not a photo): a Valencian
 * encaustic tile repeat, quarter circles in the corners and a four-point star.
 * Used as a thin band only, where it marks a boundary (footer, page heads).
 */
import './Tiles.css';

export function Tiles({ id, className, size = 28 }: { id: string; className?: string; size?: number }) {
  const s = size;
  const h = s / 2;
  return (
    <svg className={['tiles', className].filter(Boolean).join(' ')} aria-hidden="true" focusable="false" width="100%" height={s}>
      <defs>
        <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">
          <rect width={s} height={s} fill="var(--tile-bg, #f7f2e9)" />
          <path d={`M0 ${s * 0.32}A${s * 0.32} ${s * 0.32} 0 0 0 ${s * 0.32} 0H0Z M${s} ${s * 0.32}A${s * 0.32} ${s * 0.32} 0 0 1 ${s * 0.68} 0H${s}Z M0 ${s * 0.68}A${s * 0.32} ${s * 0.32} 0 0 1 ${s * 0.32} ${s}H0Z M${s} ${s * 0.68}A${s * 0.32} ${s * 0.32} 0 0 0 ${s * 0.68} ${s}H${s}Z`} fill="var(--tile-a, #d9654b)" opacity="0.85" />
          <path d={`M${h} ${s * 0.16}L${s * 0.58} ${s * 0.42}L${s * 0.84} ${h}L${s * 0.58} ${s * 0.58}L${h} ${s * 0.84}L${s * 0.42} ${s * 0.58}L${s * 0.16} ${h}L${s * 0.42} ${s * 0.42}Z`} fill="var(--tile-b, #2b2420)" opacity="0.8" />
          <circle cx={h} cy={h} r={s * 0.06} fill="var(--tile-bg, #f7f2e9)" />
        </pattern>
      </defs>
      <rect width="100%" height={s} fill={`url(#${id})`} />
    </svg>
  );
}
