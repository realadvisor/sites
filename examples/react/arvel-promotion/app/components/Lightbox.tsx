/** One lightbox dialog for every [data-lightbox] link of the page (behaviour: lightbox() in app/client.ts). */
import './Lightbox.css';

export function Lightbox() {
  return (
    <dialog className="lb" data-lightbox-dialog="" aria-label="Photo">
      <div className="lb-inner">
        <div className="lb-media" data-lb-media=""></div>
        <p className="lb-cap" data-lb-cap=""></p>
        <button type="button" className="lb-btn lb-close" data-lb-close="">Fermer</button>
        <button type="button" className="lb-btn lb-prev" data-lb-prev="" aria-label="Photo précédente">←</button>
        <button type="button" className="lb-btn lb-next" data-lb-next="" aria-label="Photo suivante">→</button>
      </div>
    </dialog>
  );
}
