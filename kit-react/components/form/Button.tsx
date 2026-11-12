/** Button or link styled as a button (port of form/Button.astro). `data-*` hooks pass through. */
import type { ReactNode } from 'react';

export type ButtonProps = {
  href?: string;
  type?: 'submit' | 'button' | 'reset';
  variant?: 'primary' | 'secondary' | 'on-photo';
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  [data: `data-${string}`]: string | boolean | undefined;
};

export function Button({ href, type = 'submit', variant = 'primary', disabled, className, children, ...data }: ButtonProps) {
  const cls = ['btn', variant === 'secondary' && 'btn--secondary', variant === 'on-photo' && 'btn--on-photo', className].filter(Boolean).join(' ');
  const attrs = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === true ? '' : v]));
  return href ? (
    <a href={href} className={cls} {...attrs}>{children}</a>
  ) : (
    <button type={type} className={cls} disabled={disabled} {...attrs}>{children}</button>
  );
}
