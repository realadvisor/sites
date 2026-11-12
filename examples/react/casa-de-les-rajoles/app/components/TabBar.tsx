/** Phones only: a bottom tab bar for the three things buyers come for. */
import { href, tr, type Lang, type Route } from '../lib/i18n';
import { Icon } from './Icon';
import './TabBar.css';

export function TabBar({ lang, route }: { lang: Lang; route?: Route }) {
  const t = tr(lang);
  const TABS = [
    { r: 'units', icon: 'units', label: t.tabs.units },
    { r: 'plans', icon: 'plan', label: t.tabs.plans },
    { r: 'contact', icon: 'contact', label: t.tabs.contact },
  ] as const;
  return (
    <nav className="tabbar" aria-label={t.tabNav}>
      {TABS.map((x) => (
        <a key={x.r} href={href(x.r, lang)} aria-current={route === x.r ? 'page' : undefined}>
          <Icon name={x.icon} size={22} />
          <span>{x.label}</span>
        </a>
      ))}
    </nav>
  );
}
