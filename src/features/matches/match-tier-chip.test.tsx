import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { MatchTierChip } from './match-tier-chip';

describe('match tier chip', () => {
  it.each([true, false])(
    'keeps a constant border width when selected is %s',
    (selected) => {
      const html = renderToStaticMarkup(
        <MatchTierChip
          tier="strong"
          label="Strong 70–84"
          selected={selected}
          onSelect={vi.fn()}
        />,
      );

      expect(html).toContain(`aria-pressed="${selected}"`);
      expect(html).toMatch(/class="[^"]*\bborder\b/);
      expect(html).toContain('transition-colors duration-200');
      expect(html).toContain(
        selected ? 'border-transparent' : 'border-white/[0.07]',
      );
    },
  );
});
