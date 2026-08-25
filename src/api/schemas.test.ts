import { describe, expect, it } from 'vitest';

import {
  jobListResponseSchema,
  jobResponseSchema,
  matchResponseSchema,
  safeExternalUrlSchema,
} from './schemas';

describe('external URL validation', () => {
  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    '/relative/path',
  ])('rejects unsafe or non-HTTP URLs: %s', (value) => {
    expect(safeExternalUrlSchema.safeParse(value).success).toBe(false);
  });

  it.each(['https://example.com/job/1', 'http://example.com/job/1'])(
    'accepts an absolute HTTP URL: %s',
    (value) => {
      expect(safeExternalUrlSchema.safeParse(value).success).toBe(true);
    },
  );

  it('rejects an unsafe source URL at the API boundary', () => {
    const result = matchResponseSchema.safeParse({
      id: 1,
      kind: 'employment',
      status: 'active',
      title: 'Frontend Developer',
      company: null,
      description: null,
      location_text: null,
      work_mode: 'remote',
      employment_type: null,
      contract_type: null,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      salary_period: null,
      published_at: null,
      first_seen_at: '2026-08-25T10:00:00Z',
      last_seen_at: '2026-08-25T10:00:00Z',
      source_url: 'javascript:alert(1)',
      score: 90,
      reasons: [],
      concerns: [],
      rules_version: 'test',
    });

    expect(result.success).toBe(false);
  });

  it('accepts documented nullable job fields and an empty page', () => {
    const job = jobResponseSchema.parse({
      id: 1,
      kind: 'employment',
      status: 'active',
      title: 'Frontend Developer',
      company: null,
      description: null,
      location_text: null,
      work_mode: 'remote',
      employment_type: null,
      contract_type: null,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      salary_period: null,
      published_at: null,
      first_seen_at: '2026-08-25T10:00:00Z',
      last_seen_at: '2026-08-25T10:00:00Z',
    });

    expect(job.company).toBeNull();
    expect(
      jobListResponseSchema.parse({ items: [], total: 0, limit: 50, offset: 0 }),
    ).toEqual({ items: [], total: 0, limit: 50, offset: 0 });
  });
});
