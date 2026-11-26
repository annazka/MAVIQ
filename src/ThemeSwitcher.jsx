import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const storageKey = 'maviq-theme';
function applyTheme(value) {
  const theme = value === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function useTheme() {
  const [value, setValue] = useState(() => document.documentElement.dataset.theme);

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
  const dark = value === 'dark';
  const Icon = dark ? Moon : Sun;
  return <button type="button" className="theme-switcher" aria-label="Mode gelap" aria-pressed={dark}
    onClick={() => onChange(dark ? 'light' : 'dark')}>
    <Icon size={18} aria-hidden="true" />
  </button>;
}
