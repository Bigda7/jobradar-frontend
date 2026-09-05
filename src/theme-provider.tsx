import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { ThemeContext } from './theme-context';
import {
  resolveThemePreference,
  THEME_STORAGE_KEY,
  type Theme,
} from './theme-preference';

function readInitialTheme(): Theme {
  const documentTheme = document.documentElement.dataset.theme;
  let storedTheme: string | null;

  try {
    storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    storedTheme = null;
  }

  return resolveThemePreference(
    documentTheme ?? storedTheme,
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The theme still applies for the current page when storage is unavailable.
  }

  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  themeColor?.setAttribute('content', theme === 'dark' ? '#101112' : '#edf1f3');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  const setTheme = useCallback((nextTheme: Theme) => {
    applyTheme(nextTheme);
    setThemeState(nextTheme);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
