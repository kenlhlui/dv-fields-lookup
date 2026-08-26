import { describe, expect, it } from 'vitest';

import demoMetadata from '@/data/metadata.json';
import { type MetadataBlock, validateMetadata } from '@/lib/metadata';
import { createMetadataSearch } from '@/lib/search';

const blocks = validateMetadata(demoMetadata);
const search = createMetadataSearch(blocks);

describe('createMetadataSearch', () => {
  it('returns all blocks in source order for a whitespace-only query', () => {
    const view = search.search('   ');

    expect(view.isSearching).toBe(false);
    expect(view.matchingFieldCount).toBe(292);
    expect(view.blocks.map(({ block }) => block.id)).toEqual([
      'citation',
      'geospatial',
      'socialscience',
      'astrophysics',
      'biomedical',
      'journal',
      'customMRA',
      'customGSD',
      'customARCS',
      'customPSRI',
      'customPSI',
      'customCHIA',
      'customDigaai',
      'customSAEF',
      'computationalworkflow',
      'LocalContextsCVoc',
      '3dobjects',
      'heal',
    ]);
  });

  it('removes unrelated blocks while retaining every Fuse-matched field in its full source block', () => {
    const view = search.search('timePeriodCovered');

    expect(view.isSearching).toBe(true);
    expect(view.matchingFieldCount).toBe(2);
    expect(view.blocks.map(({ block }) => block.id)).toEqual(['citation']);
    expect(view.blocks[0].block.fields.map((field) => field.id)).toEqual(
      blocks.find((block) => block.id === 'citation')?.fields.map((field) => field.id),
    );
    expect([...view.blocks[0].matches.keys()].sort()).toEqual(['timePeriodCoveredEnd', 'timePeriodCoveredStart']);
  });

  it('searches identifiers, definitions, best-practice definitions, and examples', () => {
    expect(search.search('authorAffiliation').blocks[0].matches.get('authorAffiliation')).toBeDefined();
    const affiliationMatches = search.search('organization with which the author is affiliated').blocks[0].matches;
    expect(affiliationMatches.has('authorAffiliation')).toBe(true);
    expect(search.search('Ada Lovelace').matchingFieldCount).toBe(0);
  });

  it('ranks a direct field-name match ahead of a definition-only match', () => {
    expect(search.search('subject').blocks[0].block.id).toBe('citation');
  });

  it('returns normalized inclusive name ranges for a direct name match', () => {
    const match = search.search('authorAffiliation').blocks[0].matches.get('authorAffiliation');

    expect(match?.ranges.name).toEqual([
      [0, 5],
      [7, 17],
    ]);
  });

  it('retains source order for blocks with equal scores', () => {
    const matchingField = {
      id: 'sameFirst',
      name: 'Same name',
      definition: 'A definition.',
      type: 'Text',
      required: false,
      repeatable: false,
      example: 'Example',
    };
    const equalScoreBlocks: MetadataBlock[] = [
      {
        id: 'first',
        name: 'First',
        description: 'First block.',
        fields: [matchingField],
      },
      {
        id: 'second',
        name: 'Second',
        description: 'Second block.',
        fields: [{ ...matchingField, id: 'sameSecond' }],
      },
    ];

    expect(createMetadataSearch(equalScoreBlocks).search('Same name').blocks.map(({ block }) => block.id)).toEqual([
      'first',
      'second',
    ]);
  });

  it('returns an empty block list for no matches', () => {
    expect(search.search('zzzz-no-field').blocks).toEqual([]);
  });
});
