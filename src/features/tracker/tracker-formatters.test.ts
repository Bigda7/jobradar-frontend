import { describe, expect, it } from 'vitest';

import { formatTrackerPlatform } from './tracker-formatters';
import type { TrackerSnapshot } from './tracker-schema';

function createSnapshot(
  overrides: Partial<TrackerSnapshot> = {},
): TrackerSnapshot {
  return {
    title: 'Frontend Developer',
    company: 'Example Labs',
    kind: 'employment',
    workMode: 'remote',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    publishedAt: null,
    ...overrides,
  };
}

describe('tracker platform formatting', () => {
  it('prefers the saved source display name', () => {
    expect(
      formatTrackerPlatform(
        createSnapshot({
          sourceName: 'dou_jobs',
          sourceDisplayName: 'DOU Jobs',
          sourceUrl: 'https://jobs.dou.ua/companies/example/vacancies/1/',
        }),
      ),
    ).toBe('DOU Jobs');
  });

  it('uses the source hostname for older tracker records', () => {
    expect(
      formatTrackerPlatform(
        createSnapshot({
          sourceUrl: 'https://www.work.ua/jobs/123/',
        }),
      ),
    ).toBe('work.ua');
  });

  it('falls back when an older record has no source information', () => {
    expect(formatTrackerPlatform(createSnapshot())).toBe(
      'Source not specified',
    );
  });
});
