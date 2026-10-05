import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { sourceResponseSchema } from '../../api/schemas';
import { SourceCard } from './source-card';

const base = {
  id: 1, name: 'djinni', display_name: 'Djinni', opportunity_kind: 'employment',
  enabled: true, last_run_at: null, last_success_at: null, last_error: null,
};

describe('metadata backlog display', () => {
  it('accepts older responses without metadata counts', () => {
    const source = sourceResponseSchema.parse(base);
    expect(source.last_metadata_deferred_count).toBeNull();
    expect(renderToStaticMarkup(<SourceCard source={source} />)).not.toContain('metadata refreshes');
  });

  it('displays planned metadata backlog separately from failed discovery', () => {
    const source = sourceResponseSchema.parse({
      ...base, last_metadata_deferred_count: 4500, last_limit_reached: false,
      last_error_count: 0, last_discovered_count: 4600, last_run_status: 'succeeded',
    });
    const html = renderToStaticMarkup(<SourceCard source={source} />);
    expect(html).toContain('4500 metadata refreshes');
    expect(html).not.toContain('Result limit reached');
    expect(html).not.toContain('0 failed');
  });

  it('keeps real detail failures visible alongside pending metadata', () => {
    const source = sourceResponseSchema.parse({
      ...base, last_metadata_deferred_count: 30, last_detail_failure_count: 2,
      last_error: 'Source reported an issue. Details are available internally.',
    });
    const html = renderToStaticMarkup(<SourceCard source={source} />);
    expect(html).toContain('2 vacancies have limited details');
    expect(html).toContain('30 metadata refreshes');
    expect(html).toContain('Last reported issue');
  });
});
