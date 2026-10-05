import { describe, expect, it } from 'vitest';

import { formatJobDate, formatLabel, formatRelativeDate } from './formatters';

describe('match formatters', () => {
  it('distinguishes source updates, publication, and first observation', () => {
    const now = Date.parse('2026-08-28T12:00:00Z');
    const job = { published_at: null, first_seen_at: '2026-08-28T09:00:00Z' };
    expect(formatJobDate(job, now)).toBe('Seen 3 hours ago');
    expect(formatJobDate({ ...job, published_at: '2026-08-28T10:00:00Z' }, now)).toBe('Published 2 hours ago');
    expect(formatJobDate({ ...job, source_updated_at: '2026-08-28T11:00:00Z' }, now)).toBe('Updated 1 hour ago');
  });
  it('clamps future publication dates to just now', () => {
    const now = Date.parse('2026-08-28T12:00:00Z');

    expect(
      formatRelativeDate('2026-08-28T15:00:00Z', 'Date unavailable', now),
    ).toBe('just now');
  });

  it('keeps past publication dates relative to the provided time', () => {
    const now = Date.parse('2026-08-28T12:00:00Z');

    expect(
      formatRelativeDate('2026-08-28T09:00:00Z', 'Date unavailable', now),
    ).toBe('3 hours ago');
  });

  it('normalizes compound employment type labels', () => {
    expect(formatLabel('Full Time,part Time')).toBe('Full Time, Part Time');
    expect(formatLabel('full_time,part_time')).toBe('Full Time, Part Time');
  });
});
