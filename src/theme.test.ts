import { describe, expect, it } from 'vitest';

import { resolveThemePreference } from './theme-preference';

describe('resolveThemePreference', () => {
  it('keeps an explicit stored theme', () => {
    expect(resolveThemePreference('light', true)).toBe('light');
    expect(resolveThemePreference('dark', false)).toBe('dark');
  });

  it('falls back to the operating system preference', () => {
    expect(resolveThemePreference(null, true)).toBe('dark');
    expect(resolveThemePreference(null, false)).toBe('light');
    expect(resolveThemePreference('unsupported', false)).toBe('light');
  });
});
