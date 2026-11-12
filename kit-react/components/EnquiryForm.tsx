/**
 * THE enquiry form (port of EnquiryForm.astro: same markup, same fields, same
 * browser script @realadvisor/sites-kit/client/enquiry, same /api/enquiry
 * contract). Every form that sends a message to the agency is this one.
 *
 *   <EnquiryForm listingId={l.id} agentId={l.agent?.id} agentName={l.agent?.first_name} message={…} />
 *   <EnquiryForm id="valuation" contactReason="valuation" />
 *   <EnquiryForm developmentId={dev.id} units={unitOptions(dev.units)} />
 *
 * Turnstile site key and preview mode come from the root loader (kitData()).
 */
import { useLocation } from 'react-router';
import { FIXTURE_TURNSTILE_SITE_KEY } from '@realadvisor/sites-sdk';
import { t as tr, lang, localeOfPath, privacyPath, type StringKey } from '@realadvisor/sites-kit/i18n';
import { useKit } from './Document';
import { Input } from './form/Input';
import { Button } from './form/Button';
import { Select } from './form/Select';

export type EnquiryFormProps = {
  /** Unique per page when the page has two forms. */
  id?: string;
  listingId?: string;
  agentId?: string;
  /** First name in the success message. */
  agentName?: string;
  developmentId?: string;
  lotId?: string;
  units?: Array<{ value: string; label: string }>;
  selectedUnit?: string;
  contactReason?: 'buy' | 'sell' | 'valuation' | 'other';
  message?: string;
  submitLabel?: string;
  locale?: string;
  className?: string;
};

export function EnquiryForm(props: EnquiryFormProps) {
  const { id = 'enquiry', listingId, agentId, agentName, developmentId, lotId, units, selectedUnit, message, submitLabel, className } = props;
  const { pathname } = useLocation();
  const kit = useKit();
  const contactReason = props.contactReason ?? (developmentId ? 'buy' : undefined);
  const locale = props.locale ?? localeOfPath(pathname);
  const t = (key: StringKey, vars: Record<string, string> = {}) => tr(key, vars, lang(locale));
  const success = agentName ? t('sentBy', { name: agentName }) : t('sent');
  const f = (name: string) => `${id}-${name}`;
  const unitSelect = !!developmentId && !lotId && !!units && units.length > 0;
  const siteKey = kit.mode === 'preview' ? null : kit.turnstileSiteKey;
  return (
    <div className={['enquiry', className].filter(Boolean).join(' ')} id={id} data-enquiry="">
      <p className="enquiry-status" role="status" aria-live="polite" tabIndex={-1} hidden data-status=""></p>
      <form
        method="post"
        action="/api/enquiry"
        noValidate
        data-msg-sent={success}
        data-msg-preview={t('preview')}
        data-msg-error={t('error')}
        data-msg-required={t('required')}
        data-msg-email={t('invalidEmail')}
        data-msg-unit={t('unitRequired')}
        data-msg-sending={t('sending')}
        data-msg-verify={t('verifyFailed')}
        data-msg-rejected={t('rejected')}
      >
        {listingId && <input type="hidden" name="listingId" value={listingId} />}
        {agentId && <input type="hidden" name="agentId" value={agentId} />}
        {developmentId && <input type="hidden" name="developmentId" value={developmentId} />}
        {developmentId && lotId && <input type="hidden" name="lotId" value={lotId} />}
        {!listingId && !lotId && contactReason && <input type="hidden" name="contactReason" value={contactReason} />}
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="idempotencyKey" defaultValue={crypto.randomUUID()} data-idempotency="" />
        <input type="hidden" name="redirect" defaultValue={`#${id}`} data-redirect="" />
        <div className="enquiry-grid">
          <div>
            <Input id={f('name')} label={`${t('name')} *`} name="name" required maxLength={100} autoComplete="name" aria-describedby={f('name-err')} />
            <p className="field-error" id={f('name-err')} hidden></p>
          </div>
          <div>
            <Input id={f('email')} label={`${t('email')} *`} name="email" type="email" required maxLength={200} autoComplete="email" aria-describedby={f('email-err')} />
            <p className="field-error" id={f('email-err')} hidden></p>
          </div>
          <div>
            <Input id={f('phone')} label={`${t('phone')} ${t('optional')}`} name="phone" type="tel" maxLength={40} autoComplete="tel" />
          </div>
          {unitSelect && (
            <div className="enquiry-full">
              <Select id={f('lot')} label={`${t('unitOfInterest')} *`} name="lotId" options={units!} value={selectedUnit} placeholder={t('chooseUnit')} required aria-describedby={f('lot-err')} />
              <p className="field-error" id={f('lot-err')} hidden></p>
            </div>
          )}
          <div className="enquiry-full">
            <Input id={f('message')} label={`${t('message')} *`} name="message" multiline required maxLength={5000} value={message} aria-describedby={f('message-err')} />
            <p className="field-error" id={f('message-err')} hidden></p>
          </div>
        </div>
        {siteKey && (
          <div className="enquiry-turnstile" data-turnstile={siteKey === FIXTURE_TURNSTILE_SITE_KEY ? 'fixture' : 'live'} data-sitekey={siteKey} data-lang={lang(locale)}></div>
        )}
        <Button type="submit">{submitLabel ?? t('send')}</Button>
        <p className="enquiry-note">{t('privacyNote')} <a href={privacyPath(locale)}>{t('privacyLink')}</a></p>
      </form>
    </div>
  );
}

export default EnquiryForm;
