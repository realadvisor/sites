/**
 * Save heart (shortlist in localStorage, saved() in app/client.ts). Rendered
 * hidden: the script shows it, so it never appears without JavaScript.
 */
import { Icon } from './Icon';
import './SaveButton.css';

export type SaveButtonProps = {
  id: string;
  href: string;
  title: string;
  price: string;
  place: string;
  facts: string;
  img: string;
  alt: string;
  className?: string;
  /** "label": a pill with text (listing page); default: a round icon button. */
  variant?: 'icon' | 'label';
};

export function SaveButton({ id, href, title, price, place, facts, img, alt, className, variant = 'icon' }: SaveButtonProps) {
  return (
    <button type="button" className={['save', `save--${variant}`, className].filter(Boolean).join(' ')} hidden aria-pressed="false"
      aria-label={variant === 'icon' ? `Enregistrer dans mes favoris : ${title}` : undefined}
      data-save="" data-id={id} data-href={href} data-title={title} data-price={price} data-place={place} data-facts={facts} data-img={img} data-alt={alt}>
      <Icon name="heart" size={variant === 'icon' ? 20 : 18} stroke={2} />
      {variant === 'label' && <span className="save__text"><span className="save__off">Enregistrer</span><span className="save__on">Enregistré</span></span>}
    </button>
  );
}
