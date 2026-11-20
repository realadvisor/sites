/**
 * Native Step-1 property valuation widget (hero / card / inline variants).
 *
 * Renders Step 1 (property type + address) natively in the agency website's
 * own CSS tokens for instant LCP and visual harmony, then hands off seamlessly
 * to the configured RealAdvisor valuation embed URL (or gracefully prefills
 * the page's `#valuation` enquiry form / `fallbackHref` when no embed URL is
 * wired yet).
 *
 *   <ValuationWidget variant="hero" />
 *   <ValuationWidget variant="card" embedUrl={org.valuation?.embed_url} />
 *   <ValuationWidget variant="inline" fallbackHref="/valuation#enquiry" />
 */
import { useLocation } from 'react-router';
import { t as tr, lang, localeOfPath, type StringKey } from '@realadvisor/sites-kit-core/i18n';
import type { ValuationPropertyType } from '@realadvisor/sites-kit-core/valuation';
import { Button } from './form/Button';
import { Input } from './form/Input';

export type ValuationWidgetProps = {
  /** Unique per page when a page renders more than one widget. */
  id?: string;
  /** Visual density and framing; inherits the site's CSS tokens. */
  variant?: 'hero' | 'card' | 'inline';
  /** Optional RealAdvisor valuation embed URL (e.g. from org.valuation.embed_url). */
  embedUrl?: string;
  /** How to open `embedUrl` once Step 1 submits. Defaults to inline chromeless iframe. */
  handoff?: 'iframe' | 'redirect';
  /** Fallback anchor or relative route when no `embedUrl` is configured yet. */
  fallbackHref?: string;
  /** Initial property type selected in Step 1. */
  defaultPropertyType?: ValuationPropertyType;
  /** Optional custom eyebrow / title / button copy (defaults to localized kit copy). */
  eyebrow?: string;
  title?: string;
  submitLabel?: string;
  note?: string;
  locale?: string;
  className?: string;
};

export function ValuationWidget(props: ValuationWidgetProps) {
  const {
    id = 'valuation-widget',
    variant = 'card',
    embedUrl,
    handoff = 'iframe',
    fallbackHref = '#valuation',
    defaultPropertyType = 'apartment',
    eyebrow,
    title,
    submitLabel,
    note,
    className,
  } = props;
  const { pathname } = useLocation();
  const locale = props.locale ?? localeOfPath(pathname);
  const t = (key: StringKey) => tr(key, {}, lang(locale));
  const f = (name: string) => `${id}-${name}`;
  const showHead = variant !== 'hero' || Boolean(eyebrow || title);

  return (
    <div
      id={id}
      className={['vw', `vw--${variant}`, className].filter(Boolean).join(' ')}
      data-valuation-widget=""
      data-embed-url={embedUrl || undefined}
      data-handoff={handoff}
      data-fallback-href={fallbackHref}
      data-locale={locale}
      data-frame-title={t('valuationFrameTitle')}
      data-msg-required={t('valuationAddressRequired')}
    >
      {showHead && (
        <div className="vw-head">
          {(eyebrow ?? (variant === 'card' ? t('valuationEyebrow') : '')) && (
            <p className="vw-eyebrow">{eyebrow ?? t('valuationEyebrow')}</p>
          )}
          {(title ?? (variant !== 'hero' ? t('valuationTitle') : '')) && (
            <h2 className="vw-title">{title ?? t('valuationTitle')}</h2>
          )}
        </div>
      )}

      <form className="vw-form" method="get" action={fallbackHref} noValidate data-vw-form="">
        <fieldset className="vw-types">
          <legend className="sr-only">{t('valuationType')}</legend>
          <span className="vw-type">
            <input
              id={f('apt')}
              type="radio"
              name="propertyType"
              value="apartment"
              defaultChecked={defaultPropertyType === 'apartment'}
            />
            <label htmlFor={f('apt')}>{t('valuationApartment')}</label>
          </span>
          <span className="vw-type">
            <input
              id={f('house')}
              type="radio"
              name="propertyType"
              value="house"
              defaultChecked={defaultPropertyType === 'house'}
            />
            <label htmlFor={f('house')}>{t('valuationHouse')}</label>
          </span>
        </fieldset>

        <div className="vw-row">
          <div>
            <Input
              id={f('address')}
              name="address"
              label={t('valuationAddress')}
              hideLabel={variant === 'hero'}
              placeholder={t('valuationAddressPlaceholder')}
              autoComplete="street-address"
              required
              maxLength={200}
              aria-describedby={f('address-err')}
            />
            <p className="field-error" id={f('address-err')} data-vw-error="" hidden></p>
          </div>
          <Button type="submit">{submitLabel ?? t('valuationStart')}</Button>
        </div>

        {(note ?? t('valuationNote')) && (
          <p className="vw-note">{note ?? t('valuationNote')}</p>
        )}
      </form>

      <div className="vw-frame-wrap" data-vw-frame-wrap="" hidden></div>
    </div>
  );
}

export default ValuationWidget;
