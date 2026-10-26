import { describe, expect, it } from 'vitest';

import { localeData } from '@/data';
import demoMetadata from '@/data/metadata.json';
import { buildMetadata, type MetadataBlock } from '@/lib/metadata';
import { createMetadataSearch, getVisibleFields, type SearchBlock } from '@/lib/search';

const { overrides: demoOverrides, blockDescriptions } = localeData('en');
const blocks = buildMetadata(demoMetadata, demoOverrides, blockDescriptions);
const search = createMetadataSearch(blocks);

function fieldIds(results: SearchBlock[]): string[] {
  return results.flatMap((result) => [...result.matches.keys()]);
}

describe('createMetadataSearch', () => {
  it('returns all blocks in source order for a whitespace-only query', () => {
    const view = search.search('   ');

    expect(view.isSearching).toBe(false);
    expect(view.matchingFieldCount).toBe(155);
    expect(view.blocks.map(({ block }) => block.id)).toEqual([
      'citation',
      'geospatial',
      'socialscience',
      'astrophysics',
      'biomedical',
      'journal',
      'computationalworkflow',
      '3dobjects',
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
    expect([...view.blocks[0].matches.keys()].sort()).toEqual([
      'timePeriodCovered.timePeriodCoveredEnd',
      'timePeriodCovered.timePeriodCoveredStart',
    ]);
  });

  it('searches identifiers, definitions, best-practice definitions, and examples', () => {
    expect(search.search('authorAffiliation').blocks[0].matches.get('author.authorAffiliation')).toBeDefined();
    const affiliationMatches = search.search('avoid abbreviations').blocks[0].matches;
    expect(affiliationMatches.has('author.authorAffiliation')).toBe(true);
    expect(search.search('Ada Lovelace').matchingFieldCount).toBe(0);
  });

  it('matches multi-word queries in any order, requiring every word', () => {
    const reordered = search.search('affiliation author');

    expect(reordered.matchingFieldCount).toBe(1);
    expect(reordered.blocks[0].matches.has('author.authorAffiliation')).toBe(true);
    expect(search.search('affiliation zzzz').matchingFieldCount).toBe(0);
  });

  it('requires short words to match exactly while tolerating a typo in longer words', () => {
    const title = search.search('title');

    expect(fieldIds([...title.blocks, ...title.similarBlocks])).not.toContain('keyword.keywordVocabularyURI');
    expect(search.search('email').matchingFieldCount).toBe(1);
    expect(fieldIds(search.search('subjct').similarBlocks)).toContain('subject');
  });

  it('only matches at word starts, including camelCase humps', () => {
    const cityMatches = search.search('city').blocks.flatMap((result) => [...result.matches.keys()]);

    expect(cityMatches).toContain('geographicCoverage.city');
    expect(cityMatches).not.toContain('coverage.RedshiftValue.coverage.Redshift.MinimumValue');
    expect(search.search('url').blocks[0].matches.get('producer.producerURL')?.ranges.id).toEqual([[17, 19]]);
  });

  it('lists typo-tolerant matches separately from exact matches', () => {
    const contact = search.search('contact');

    expect(fieldIds(contact.blocks)).toContain('datasetContact.datasetContactEmail');
    expect(fieldIds(contact.blocks)).not.toContain('grantNumber.grantNumberValue');
    expect(fieldIds(contact.similarBlocks)).toContain('grantNumber.grantNumberValue');
    expect(fieldIds(contact.similarBlocks)).not.toContain('datasetContact.datasetContactEmail');

    // A typo match only lines up some letters; the highlight still covers the whole word.
    const contract = contact.similarBlocks
      .find((result) => result.matches.has('grantNumber.grantNumberValue'))
      ?.matches.get('grantNumber.grantNumberValue');
    const definition =
      blocks.flatMap((block) => block.fields).find((field) => field.id === 'grantNumber.grantNumberValue')
        ?.definition ?? '';
    const start = definition.indexOf('contract');
    expect(contract?.ranges.definition).toEqual([[start, start + 'contract'.length - 1]]);

    const typo = search.search('affilation');
    expect(typo.blocks).toEqual([]);
    expect(fieldIds(typo.similarBlocks)).toContain('author.authorAffiliation');
  });

  it('matches space-separated keywords in translated Chinese text', () => {
    const { overrides, blockDescriptions: zhBlockDescriptions } = localeData('zh-hk');
    const zhSearch = createMetadataSearch(buildMetadata(demoMetadata, overrides, zhBlockDescriptions));
    const match = zhSearch.search('機構 縮寫').blocks[0].matches.get('author.authorAffiliation');

    expect(match?.ranges.bestPracticeDefinition).toEqual([
      [6, 7],
      [18, 19],
    ]);
  });

  it('ranks a direct field-name match ahead of a definition-only match', () => {
    expect(search.search('subject').blocks[0].block.id).toBe('citation');
  });

  it('returns normalized inclusive name ranges for a direct name match', () => {
    const match = search.search('authorAffiliation').blocks[0].matches.get('author.authorAffiliation');

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

    expect(
      createMetadataSearch(equalScoreBlocks)
        .search('Same name')
        .blocks.map(({ block }) => block.id),
    ).toEqual(['first', 'second']);
  });

  it('returns an empty block list for no matches', () => {
    expect(search.search('zzzz-no-field').blocks).toEqual([]);
  });
});

describe('getVisibleFields', () => {
  const mixedBlock: MetadataBlock = {
    id: 'mixed',
    name: 'Mixed',
    description: 'A block with a required and an optional field.',
    fields: [
      {
        id: 'required1',
        name: 'Required Widget',
        definition: 'A required field.',
        type: 'Text',
        required: true,
        repeatable: false,
        recommendation: 'Required',
      },
      {
        id: 'optional1',
        name: 'Optional Widget',
        definition: 'An optional field.',
        type: 'Text',
        required: false,
        repeatable: false,
        recommendation: 'Optional',
      },
    ],
  };
  const mixedSearch = createMetadataSearch([mixedBlock]);

  it('applies fieldFilter on top of the browsing (all-fields) case', () => {
    const browsing = mixedSearch.search('   ').blocks[0];

    expect(getVisibleFields(browsing, (field) => field.required).map((field) => field.id)).toEqual(['required1']);
    expect(getVisibleFields(browsing)).toHaveLength(2);
  });

  it('applies fieldFilter on top of the search-matches case', () => {
    const searching = mixedSearch.search('widget').blocks[0];

    expect(searching.matches.size).toBe(2);
    expect(
      getVisibleFields(searching, (field) => field.recommendation === 'Optional').map((field) => field.id),
    ).toEqual(['optional1']);
  });
});
