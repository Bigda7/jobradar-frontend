import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { TrackerCard, TrackerDragOverlayCard } from './tracker-card';
import { TrackerColumn } from './tracker-column';
import type { TrackerRecord } from './tracker-schema';
import { TrackerTable } from './tracker-table';

function record(opportunityId: number): TrackerRecord {
  return {
    opportunityId,
    status: 'applied',
    notes: '',
    snapshot: {
      title: `Developer ${opportunityId}`,
      company: 'Example Company',
      kind: 'employment',
      workMode: 'remote',
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryPeriod: null,
      publishedAt: null,
    },
    createdAt: '2026-10-16T10:00:00Z',
    updatedAt: '2026-10-16T10:00:00Z',
  };
}

const records = [record(42), record(43)];

describe('tracker selection', () => {
  it('marks the current record in both desktop and mobile lists', () => {
    const html = renderToStaticMarkup(
      <TrackerTable records={records} selectedId={42} onSelect={vi.fn()} />,
    );

    expect(html.match(/data-selected="true"/g)).toHaveLength(2);
    expect(html.match(/data-selected="false"/g)).toHaveLength(2);
    expect(html.match(/aria-current="true"/g)).toHaveLength(2);
    expect(html).toMatch(/aria-label="Open details for Developer 42" aria-current="true"/);
    expect(html).not.toMatch(/aria-label="Open details for Developer 43" aria-current/);
    expect(html).toContain('shadow-[inset_3px_0_0_var(--color-radar)]');
  });

  it('moves the current marker to the newly selected record', () => {
    const html = renderToStaticMarkup(
      <TrackerTable records={records} selectedId={43} onSelect={vi.fn()} />,
    );

    expect(html).toMatch(/aria-label="Open details for Developer 43" aria-current="true"/);
    expect(html).not.toMatch(/aria-label="Open details for Developer 42" aria-current/);
    expect(html.match(/aria-current="true"/g)).toHaveLength(2);
  });

  it.each([null, 999])('does not highlight a closed or absent record (%s)', (selectedId) => {
    const html = renderToStaticMarkup(
      <TrackerTable records={records} selectedId={selectedId} onSelect={vi.fn()} />,
    );

    expect(html).not.toContain('data-selected="true"');
    expect(html).not.toContain('aria-current');
    expect(html).not.toContain('shadow-[inset_3px_0_0_var(--color-radar)]');
  });

  it.each([true, false])('reflects the selected state on a board card (%s)', (isSelected) => {
    const html = renderToStaticMarkup(
      <TrackerCard record={records[0]} onSelect={vi.fn()} isSelected={isSelected} sortable={false} />,
    );

    expect(html).toContain(`data-selected="${isSelected}"`);
    expect(html.includes('aria-current="true"')).toBe(isSelected);
    expect(html.includes('shadow-[inset_3px_0_0_var(--color-radar)]')).toBe(isSelected);
    expect(html.includes('shadow-sm')).toBe(!isSelected);
  });

  it('passes the selected record through the pipeline column', () => {
    const html = renderToStaticMarkup(
      <TrackerColumn status="applied" records={records} selectedId={43} onSelect={vi.fn()} />,
    );

    expect(html.match(/data-selected="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-label="Open details for Developer 43" aria-current="true"/);
  });

  it('keeps drag previews separate from the selected record', () => {
    const html = renderToStaticMarkup(<TrackerDragOverlayCard record={records[0]} />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('aria-current');
    expect(html).not.toContain('data-selected="true"');
  });
});
