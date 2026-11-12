/** The lightbox dialog for [data-lightbox] links on the page (app/scripts/lightbox.ts). */
import type { L } from '../lib/routes';
import { c } from '../lib/copy';
import './Lightbox.css';

export function Lightbox({ l }: { l: L }) {
  return (
    <dialog className="lightbox" data-dialog="" aria-label={c('gallery', l)}>
      <div className="lb-bar">
        <span data-count="" className="num"></span>
        <button type="button" data-close="">{c('close', l)}</button>
      </div>
      <figure>
        <img data-img="" alt="" />
        <figcaption data-cap=""></figcaption>
      </figure>
      <button type="button" className="nav prev" data-prev="" aria-label={c('prev', l)}>‹</button>
      <button type="button" className="nav next" data-next="" aria-label={c('next', l)}>›</button>
    </dialog>
  );
}
