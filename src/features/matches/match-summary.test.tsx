import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { MatchSummary } from './match-summary';
import { getLoadedMatchMetrics } from './match-view';

describe('MatchSummary', () => {
  it('keeps all groups available and exposes aligned label/value semantics', () => {
    const html = renderToStaticMarkup(<MatchSummary metrics={getLoadedMatchMetrics([])} trackedCount={19} tierFocus="strong" onSelectTier={vi.fn()} />);

    expect(html).toContain('aria-label="Match groups"');
    expect(html.match(/<button/g)).toHaveLength(4);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Strong 70–84/);
    expect(html.match(/<dt /g)).toHaveLength(4);
    expect(html.match(/<dd /g)).toHaveLength(4);
    expect(html).toContain('Salary shown');
    expect(html).toContain('>19</dd>');
  });
});
