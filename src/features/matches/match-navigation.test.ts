import { describe, expect, it } from 'vitest';

import { createMatchRoute, readMatchPageOptions } from './match-navigation';

describe('match navigation', () => {
  it.each(['', 'min_score=35&max_score=54'])(
    'defaults to newest first for the match range %s',
    (query) => {
      expect(readMatchPageOptions(new URLSearchParams(query)).sort).toBe('newest');
    },
  );

  it.each(['score', 'newest', 'company'] as const)(
    'preserves an explicit %s sort instead of replacing it with the default',
    (sort) => {
      expect(readMatchPageOptions(new URLSearchParams({ sort })).sort).toBe(sort);
      const route = createMatchRoute(12, { sort });
      expect(new URL(route, 'https://example.test').searchParams.get('sort')).toBe(sort);
    },
  );

  it('uses newest first in generated routes when sorting was not specified', () => {
    const route = createMatchRoute(12, {});
    expect(new URL(route, 'https://example.test').searchParams.get('sort')).toBe('newest');
  });

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
      maximumScore: 100,
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
      maximumScore: 100,
      offset: 0,
      sort: 'newest',
      tierFocus: 'all',
    });
  });

  it('restores a selected score tier from the page URL', () => {
    const options = readMatchPageOptions(new URLSearchParams('tier=strong'));

    expect(options.tierFocus).toBe('strong');
  });

  it('preserves the exploratory range in links and restores it on reload', () => {
    const route = createMatchRoute(12, { min_score: 35, max_score: 54, offset: 50 });
    const params = new URL(route, 'https://example.test').searchParams;
    expect(readMatchPageOptions(params)).toMatchObject({
      minimumScore: 35, maximumScore: 54, offset: 50,
    });
  });

  it('rejects an upper bound below the lower bound', () => {
    expect(readMatchPageOptions(new URLSearchParams('min_score=70&max_score=54')))
      .toMatchObject({ minimumScore: 70, maximumScore: 100 });
  });
});
