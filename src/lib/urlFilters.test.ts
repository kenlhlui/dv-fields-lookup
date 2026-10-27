/* Test for urlFilters.ts */

import { describe, expect, it } from 'vitest';
import { parseFiltersFromUrl, serializeFilters, type UrlQuery } from '@/lib/urlFilters';

// Testing fixtures
const blockIds = ['citation', 'geospatial'];
const bestPracticeTiers = ['Recommended', 'Optional'] as const;

describe('parseFiltersFromUrl', () => {
  it('parse query parameters correctly', () => {
    const search = '?q=author&block=citation&block=geospatial&required=true&bestPractice=Recommended';
    const result = parseFiltersFromUrl(search, blockIds, bestPracticeTiers);
    expect(result).toEqual({
      q: 'author',
      block: ['citation', 'geospatial'],
      required: true,
      bestPractice: ['Recommended'],
    });
  });

  it('handle missing parameters gracefully', () => {
    const search = '?block=citation&required=false';
    const result = parseFiltersFromUrl(search, blockIds, bestPracticeTiers);
    expect(result).toEqual({
      q: '',
      block: ['citation'],
      required: false,
      bestPractice: [],
    });
  });

  it('ignore unknown block IDs and best practice tiers', () => {
    const search = '?q=test&block=unknown&bestPractice=Invalid';
    const result = parseFiltersFromUrl(search, blockIds, bestPracticeTiers);
    expect(result).toEqual({
      q: 'test',
      block: [],
      required: false,
      bestPractice: [],
    });
  });
});

describe('serializeFilters', () => {
  it('writes every filter and encodes spaces as +', () => {
    const filters: UrlQuery = { q: 'author name', block: ['citation'], required: true, bestPractice: ['Recommended'] };
    expect(serializeFilters(filters)).toBe('q=author+name&block=citation&required=true&bestPractice=Recommended');
  });

  it('returns an empty string when no filters are set', () => {
    const filters: UrlQuery = { q: '', block: [], required: false, bestPractice: [] };
    expect(serializeFilters(filters)).toBe('');
  });

  it('round-trips through parseFiltersFromUrl, including an escaped &', () => {
    const filters: UrlQuery = {
      q: 'soil & water',
      block: ['citation', 'geospatial'],
      required: true,
      bestPractice: ['Recommended'],
    };
    expect(parseFiltersFromUrl(serializeFilters(filters), blockIds, bestPracticeTiers)).toEqual(filters);
  });
});
