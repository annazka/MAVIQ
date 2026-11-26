import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

const storageKey = 'maviq-theme';
const themes = [
  ['system', 'Ikuti sistem', Monitor],
  ['light', 'Terang', Sun],
  ['dark', 'Gelap', Moon]
];

function applyTheme(value) {
  const root = document.documentElement;
  if (value === 'light' || value === 'dark') {
    root.dataset.theme = value;
    return value;
  }
  delete root.dataset.theme;
  return 'system';
}

export function useTheme() {
  const [value, setValue] = useState(() => document.documentElement.dataset.theme ?? 'system');

  useEffect(() => {
    const syncTheme = event => {
      if (event.storageArea === localStorage && (event.key === storageKey || event.key === null)) {
        setValue(applyTheme(event.newValue));
      }
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  function onChange(value) {
    setValue(applyTheme(value));
    try { localStorage.setItem(storageKey, value); } catch {}
  }

  return { value, onChange };
}

export default function ThemeSwitcher({ value, onChange }) {
  const [, label, Icon] = themes.find(([id]) => id === value);
  return <label className="theme-switcher" title={'Tema tampilan · ' + label}>
    <Icon size={18} aria-hidden="true" />
    <span aria-hidden="true">Tema tampilan</span>
    <select aria-label="Tema tampilan" value={value} onChange={event => onChange(event.target.value)}>
      {themes.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select>
  </label>;
}
