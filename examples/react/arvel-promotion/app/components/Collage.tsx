/** Staggered three-photo collage (centre tall, sides offset). Photos keep their crop within ~10%. */
import type { Photo as DataPhoto } from '@realadvisor/sites-sdk/types';
import { Photo } from './Photo';
import './Collage.css';

export function Collage({ photos, fallbackAlt }: { photos: DataPhoto[]; fallbackAlt: string }) {
  const [a, b, c] = photos;
  if (!a || !b || !c) return null;
  return (
    <div className="collage">
      <figure className="cl-f1 frame settle"><Photo src={a} alt={a.alt || fallbackAlt} width={720} height={540} sizes="(min-width: 900px) 30vw, 60vw" /></figure>
      <figure className="cl-f2 frame settle"><Photo src={b} alt={b.alt || fallbackAlt} width={720} height={960} sizes="(min-width: 900px) 34vw, 100vw" mobile={{ width: 800, height: 600 }} /></figure>
      <figure className="cl-f3 frame settle"><Photo src={c} alt={c.alt || fallbackAlt} width={720} height={540} sizes="(min-width: 900px) 30vw, 60vw" /></figure>
    </div>
  );
}
