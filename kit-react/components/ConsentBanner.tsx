/**
 * Analytics consent (port of ConsentBanner.astro; the browser side is the
 * Astro kit's client/consent.ts). Renders only when ANALYTICS_ID is set;
 * GA4 loads only after "Accept". Keep both buttons equal in weight.
 */
import { lang, privacyPath, t } from '@realadvisor/sites-kit-core/i18n';
import { useKit, usePageLocale } from './Document';

/** `locale`: default the page's (from its path), as the rest of the page. */
export function ConsentBanner({ locale: localeProp }: { locale?: string }) {
  const { analyticsId } = useKit();
  const pathLocale = usePageLocale();
  if (!analyticsId) return null;
  const locale = localeProp ?? pathLocale;
  const l = lang(locale);
  return (
    <div className="consent" role="region" aria-label="Cookies" hidden data-consent={analyticsId}>
      <p>{t('consentText', {}, l)} <a href={privacyPath(locale)}>{t('privacyLink', {}, l)}</a></p>
      <div className="consent-actions">
        <button type="button" className="btn btn--secondary" data-choice="denied">{t('decline', {}, l)}</button>
        <button type="button" className="btn btn--secondary" data-choice="granted">{t('accept', {}, l)}</button>
      </div>
    </div>
  );
}
