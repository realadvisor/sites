/** Styled native select (port of form/Select.astro). `placeholder` adds a first option "" (no filter). */
export type Option = { value: string; label: string };
export type SelectProps = {
  label: string;
  name: string;
  options: Option[];
  value?: string | null;
  placeholder?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  required?: boolean;
  'aria-describedby'?: string;
  id?: string;
  className?: string;
};

export function Select({ label, name, options, value, placeholder, hideLabel, disabled, required, id, className, 'aria-describedby': describedBy }: SelectProps) {
  const fieldId = id ?? `f-${name}`;
  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label htmlFor={fieldId} className={hideLabel ? 'field-label sr-only' : 'field-label'}>{label}</label>
      <span className="select">
        <select id={fieldId} name={name} className="control" disabled={disabled} required={required} aria-describedby={describedBy} defaultValue={value ?? ''}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </span>
    </div>
  );
}
