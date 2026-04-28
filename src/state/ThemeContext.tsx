import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ThemeContext,
  type ThemeContextValue,
  type ThemeMode,
} from './themeStore';

const storageKey = 'sicd-theme-mode';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = window.localStorage.getItem(storageKey);
  return savedTheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem(storageKey, theme);
    document.body.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme() {
        setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
