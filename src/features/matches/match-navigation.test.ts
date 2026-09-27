import { describe, expect, it } from 'vitest';

import { createMatchRoute, readMatchPageOptions } from './match-navigation';

describe('match navigation', () => {
  it('keeps the cached page and filters when linking to a loaded match', () => {
    const route = createMatchRoute(214, {
      min_score: 70,
      source: 'djinni',
      sort: 'newest',
      limit: 50,
      offset: 50,
    });
    const params = new URL(route, 'https://example.test').searchParams;

    expect(params.get('opportunity')).toBe('214');
    expect(readMatchPageOptions(params)).toEqual({
      minimumScore: 70,
      offset: 50,
      sort: 'newest',
      tierFocus: 'all',
    });
    expect(params.get('source')).toBe('djinni');
    expect(params.has('tier')).toBe(false);
  });

  it('uses safe defaults for invalid page parameters', () => {
    const options = readMatchPageOptions(
      new URLSearchParams('min_score=999&offset=-50&sort=unknown'),
    );

    expect(options).toEqual({
      minimumScore: 55,
      offset: 0,
      sort: 'score',
      tierFocus: 'all',
    });
  });

  it('restores a selected score tier from the page URL', () => {
    const options = readMatchPageOptions(new URLSearchParams('tier=strong'));

    expect(options.tierFocus).toBe('strong');
  });
});
