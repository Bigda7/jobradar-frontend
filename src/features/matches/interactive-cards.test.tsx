import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { MatchResponse } from '../../api';
import { TrackerCard } from '../tracker/tracker-card';
import { TrackerTable } from '../tracker/tracker-table';
import type { TrackerRecord } from '../tracker/tracker-schema';
import { MatchCard } from './match-card';

const match: MatchResponse = {
  id: 42,
  kind: 'employment',
  status: 'active',
  title: 'Frontend Developer',
  company: 'Example',
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
  source_url: 'https://example.com/job',
  source_name: 'example',
  source_display_name: 'Example Jobs',
  score: 85,
  reasons: [],
  concerns: [],
  matched_skills: [],
  rules_version: 'test',
};

const record: TrackerRecord = {
  opportunityId: 42,
  status: 'saved',
  notes: '',
  snapshot: {
    title: 'Frontend Developer',
    company: 'Example',
    kind: 'employment',
    workMode: 'remote',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    publishedAt: null,
  },
  createdAt: '2026-08-25T10:00:00Z',
  updatedAt: '2026-08-25T10:00:00Z',
};

describe('interactive cards', () => {
  it('renders a separate details button and a level-two heading for matches', () => {
    const html = renderToStaticMarkup(
      <MatchCard match={match} isSelected={false} onSelect={vi.fn()} />,
    );

    expect(html).toContain('aria-label="Open details for Frontend Developer"');
    expect(html).toContain('<h2');
    expect(html).not.toMatch(/<article[^>]*tabindex/);
    expect(html.match(/<button/g)).toHaveLength(2);
  });

  it('keeps tracker details and status as separate controls in both layouts', () => {
    const html = renderToStaticMarkup(
      <TrackerTable records={[record]} onSelect={vi.fn()} />,
    );

    expect(html).toContain('aria-label="Open details for Frontend Developer"');
    expect(html).toContain('<h2');
    expect(html).not.toMatch(/<article[^>]*tabindex/);
    expect(html).not.toMatch(/<tr[^>]*tabindex/);
  });

  it('renders the tracker board card with a details button', () => {
    const html = renderToStaticMarkup(
      <TrackerCard record={record} onSelect={vi.fn()} sortable={false} />,
    );

    expect(html).toContain('aria-label="Open details for Frontend Developer"');
    expect(html).not.toMatch(/<article[^>]*tabindex/);
  });
});
