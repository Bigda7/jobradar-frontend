export const THEME_STORAGE_KEY = 'jobradar-theme';

export type Theme = 'light' | 'dark';

export function resolveThemePreference(
  storedTheme: string | null,
  prefersDark: boolean,
): Theme {
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return prefersDark ? 'dark' : 'light';
}
