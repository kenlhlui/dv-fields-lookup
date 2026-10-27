/* Test for urlFilters.ts */

import { describe, expect, it } from 'vitest';
import { parseFiltersFromUrl } from '@/lib/urlFilters';

describe('parseFiltersFromUrl', () => {
  const blockIds = ['citation', 'geospatial'];
  const bestPracticeTiers = ['Recommended', 'Optional'] as const;

  it('should parse query parameters correctly', () => {
    const search = '?q=author&block=citation&block=geospatial&required=true&bestPractice=Recommended';
    const result = parseFiltersFromUrl(search, blockIds, bestPracticeTiers);
    expect(result).toEqual({
      q: 'author',
      block: ['citation', 'geospatial'],
      required: true,
      bestPractice: ['Recommended'],
    });
  });

  it('should handle missing parameters gracefully', () => {
    const search = '?block=citation&required=false';
    const result = parseFiltersFromUrl(search, blockIds, bestPracticeTiers);
    expect(result).toEqual({
      q: '',
      block: ['citation'],
      required: false,
      bestPractice: [],
    });
  });

  it('should ignore unknown block IDs and best practice tiers', () => {
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
