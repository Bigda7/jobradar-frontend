import { describe, expect, it } from 'vitest';

import { formatLabel, formatRelativeDate } from './formatters';

describe('match formatters', () => {
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
