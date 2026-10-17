import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDrawerAccessibility } from '../../hooks/use-drawer-accessibility';
import { TrackerDetails } from './tracker-details';
import type { TrackerRecord } from './tracker-schema';
import { TrackerTable } from './tracker-table';

const record: TrackerRecord = {
  opportunityId: 42,
  status: 'applied',
  notes: '',
  snapshot: {
    title: 'AI-Assisted Software Engineer, Web Applications',
    company: 'Example Company',
    kind: 'employment',
    workMode: 'remote',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    publishedAt: null,
  },
  createdAt: '2026-10-17T10:00:00Z',
  updatedAt: '2026-10-17T10:00:00Z',
};

afterEach(() => vi.unstubAllGlobals());

describe('tracker layout', () => {
  it('uses the available list width, not the viewport, to select its layout', () => {
    const html = renderToStaticMarkup(
      <TrackerTable records={[record]} selectedId={42} onSelect={vi.fn()} />,
    );

    expect(html).toContain('@container/tracker-table');
    expect(html).toContain('@min-[900px]/tracker-table:hidden');
    expect(html).toContain('hidden @min-[900px]/tracker-table:block');
    expect(html).toContain('table-fixed');
    expect(html).toContain('<colgroup>');
    expect(html).not.toContain('min-w-[900px]');
    expect(html).not.toContain('overflow-x-auto');
    expect(html).not.toMatch(/\bmd:(hidden|block)/);
    expect(html).toContain('Vacancy Date unavailable');
    expect(html).toContain('Updated ');
  });

  it.each([390, 1024, 1280, 1440, 1599.5, 1600, 1920])(
    'keeps modal behavior aligned with the tracker panel breakpoint at %s pixels',
    (width) => {
      const matchMedia = vi.fn((query: string) => ({
        matches: query === '(width < 100rem)' && width < 1600,
      }));
      vi.stubGlobal('window', { matchMedia });

      const html = renderToStaticMarkup(<TrackerDetails record={record} onClose={vi.fn()} />);

      expect(matchMedia).toHaveBeenCalledWith('(width < 100rem)');
      expect(html.includes('aria-modal="true"')).toBe(width < 1600);
      expect(html).toContain('min-[100rem]:static');
      expect(html).not.toContain('xl:static');
      expect(html).toContain('[scrollbar-gutter:stable]');
    },
  );

  it('preserves the default breakpoint for non-tracker drawers', () => {
    const matchMedia = vi.fn(() => ({ matches: true }));
    vi.stubGlobal('window', { matchMedia });

    function DefaultDrawer() {
      const { isModal } = useDrawerAccessibility(vi.fn());
      return <div aria-modal={isModal || undefined} />;
    }

    expect(renderToStaticMarkup(<DefaultDrawer />)).toContain('aria-modal="true"');
    expect(matchMedia).toHaveBeenCalledWith('(max-width: 1279px)');
  });
});
