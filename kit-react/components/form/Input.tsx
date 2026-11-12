/** Text-like input with its label (port of form/Input.astro). `multiline` for a textarea. */
import type { InputHTMLAttributes } from 'react';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string;
  name: string;
  hideLabel?: boolean;
  multiline?: boolean;
  className?: string;
};

export function Input({ label, hideLabel, multiline, className, id, type = 'text', value, ...rest }: InputProps) {
  const fieldId = id ?? `f-${rest.name}`;
  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label htmlFor={fieldId} className={hideLabel ? 'field-label sr-only' : 'field-label'}>{label}</label>
      {multiline ? (
        <textarea id={fieldId} className="control" defaultValue={value as string | undefined} {...(rest as object)} />
      ) : (
        <input id={fieldId} className="control" type={type} defaultValue={value as string | undefined} {...rest} />
      )}
    </div>
  );
}
