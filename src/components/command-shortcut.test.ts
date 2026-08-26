import { describe, expect, it } from 'vitest';

import {
  getCommandPaletteShortcutLabel,
  isMacPlatform,
  matchesCommandPaletteShortcut,
} from './command-shortcut';

describe('command palette shortcut', () => {
  it('uses Ctrl+Slash on Windows because browsers reserve Ctrl+K', () => {
    expect(
      matchesCommandPaletteShortcut(
        { code: 'Slash', ctrlKey: true, key: '/', metaKey: false },
        false,
      ),
    ).toBe(true);

    expect(
      matchesCommandPaletteShortcut(
        { code: 'KeyK', ctrlKey: true, key: 'k', metaKey: false },
        false,
      ),
    ).toBe(false);
  });

  it('uses Command+K on macOS', () => {
    expect(
      matchesCommandPaletteShortcut(
        { code: 'KeyK', ctrlKey: false, key: 'K', metaKey: true },
        true,
      ),
    ).toBe(true);
  });

  it('detects Apple platforms and renders the matching label', () => {
    expect(isMacPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe(true);
    expect(isMacPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(
      false,
    );
    expect(getCommandPaletteShortcutLabel(true)).toBe('⌘ K');
    expect(getCommandPaletteShortcutLabel(false)).toBe('Ctrl /');
  });
});
