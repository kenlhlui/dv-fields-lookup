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
    expect(view.matchingFieldCount).toBe(14);
    expect(view.blocks.map(({ block }) => block.id)).toEqual([
      'citation',
      'geospatial',
      'socialScience',
      'astronomy',
    ]);
  });

  it('removes unrelated blocks while retaining every Fuse-matched field in its full source block', () => {
    const view = search.search('ORCID');

    expect(view.isSearching).toBe(true);
    expect(view.matchingFieldCount).toBe(2);
    expect(view.blocks.map(({ block }) => block.id)).toEqual(['citation']);
    expect(view.blocks[0].block.groups.flatMap((group) => group.fields).map((field) => field.id)).toEqual([
      'authorName',
      'authorIdentifier',
      'authorIdentifierScheme',
      'otherId',
      'otherIdAgency',
    ]);
    expect([...view.blocks[0].matches.keys()]).toEqual(['authorIdentifier', 'authorIdentifierScheme']);
  });

  it('searches identifiers, aliases, summaries, descriptions, and examples', () => {
    expect(search.search('authorIdentifier').blocks[0].matches.get('authorIdentifier')).toBeDefined();
    expect(search.search('researcher ID').matchingFieldCount).toBe(1);
    expect(search.search('persistent identifier').blocks[0].matches.get('authorIdentifier')?.ranges.summary).toEqual([[0, 20]]);
    expect(search.search('globally unique').matchingFieldCount).toBe(1);
    expect(search.search('0000-0002-1825-0097').matchingFieldCount).toBe(1);
  });

  it('ranks a direct field-name match ahead of a description-only match', () => {
    expect(search.search('identifier').blocks[0].block.id).toBe('citation');
  });

  it('returns normalized inclusive name ranges for a direct name match', () => {
    const match = search.search('Identifier').blocks[0].matches.get('authorIdentifier');

    expect(match?.ranges.name).toEqual([[0, 9]]);
  });

  it('retains source order for blocks with equal scores', () => {
    const matchingField = {
      id: 'sameFirst',
      name: 'Same name',
      summary: 'A summary.',
      description: 'A description.',
      type: 'Text',
      required: false,
      repeatable: false,
      example: 'Example',
      aliases: [],
    };
    const equalScoreBlocks: MetadataBlock[] = [
      {
        id: 'first',
        name: 'First',
        description: 'First block.',
        groups: [{ id: 'firstGroup', name: 'First group', fields: [matchingField] }],
      },
      {
        id: 'second',
        name: 'Second',
        description: 'Second block.',
        groups: [{ id: 'secondGroup', name: 'Second group', fields: [{ ...matchingField, id: 'sameSecond' }] }],
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
