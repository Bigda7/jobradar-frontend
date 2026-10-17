import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const component = readFileSync(new URL('./command-palette.tsx', import.meta.url), 'utf8');

describe('command palette focus styling', () => {
  it('replaces only the search input outline with a focus-within row indicator', () => {
    expect(component).toContain('className="command-palette-search ');
    expect(component).toContain('className="command-palette-input ');
    expect(styles).toMatch(/\.command-palette-input:focus-visible\s*\{\s*outline: none;/);
    expect(styles).toMatch(
      /\.command-palette-search:focus-within\s*\{[^}]*box-shadow: inset 0 -2px 0/,
    );
  });

  it('keeps the shared keyboard focus indicator and reduced-motion override', () => {
    expect(styles).toMatch(/\n:focus-visible\s*\{\s*outline: 2px solid var\(--color-radar\);/);
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain('transition-duration: 0.01ms !important;');
  });
});
