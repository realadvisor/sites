/**
 * Searchable select for long lists (port of form/Combobox.astro): a native
 * select (works without JS), upgraded by @realadvisor/sites-kit-core/client/combobox.
 */
import type { Option } from './Select';

export type ComboboxProps = {
  label: string;
  name: string;
  options: Option[];
  value?: string | null;
  placeholder?: string;
  hideLabel?: boolean;
  noResults?: string;
  id?: string;
  className?: string;
};

export function Combobox({ label, name, options, value, placeholder = '', hideLabel, noResults = '–', id, className }: ComboboxProps) {
  const fieldId = id ?? `f-${name}`;
  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label htmlFor={fieldId} className={hideLabel ? 'field-label sr-only' : 'field-label'}>{label}</label>
      <div className="combobox" data-combobox="" data-no-results={noResults}>
        <span className="select">
          <select id={fieldId} name={name} className="control" defaultValue={value ?? ''}>
            <option value="">{placeholder}</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </span>
      </div>
    </div>
  );
}
