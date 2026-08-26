import { describe, expect, it } from 'vitest';

import demoMetadata from '@/data/metadata.json';
import { countFields, getFieldPath, validateMetadata } from '@/lib/metadata';

const valid = [
  {
    id: 'citation',
    name: 'Citation Metadata',
    description: 'Core information used to identify and cite a dataset.',
    groups: [
      {
        id: 'author',
        name: 'Author',
        fields: [
          {
            id: 'authorIdentifier',
            name: 'Identifier',
            summary: 'A persistent identifier for the author.',
            description: 'A globally unique identifier associated with the author.',
            type: 'Text',
            required: false,
            repeatable: true,
            example: 'https://orcid.org/0000-0002-1825-0097',
            aliases: ['ORCID'],
          },
        ],
      },
    ],
  },
];

describe('validateMetadata', () => {
  it('returns valid metadata', () => {
    expect(validateMetadata(valid)).toEqual(valid);
  });

  it.each([
    ['an empty dataset', []],
    ['an empty block id', [{ ...valid[0], id: '' }]],
    ['a block without groups', [{ ...valid[0], groups: [] }]],
    ['a field with the wrong required type', [{ ...valid[0], groups: [{ ...valid[0].groups[0], fields: [{ ...valid[0].groups[0].fields[0], required: 'no' }] }] }]],
  ])('rejects %s', (_label, input) => {
    expect(() => validateMetadata(input)).toThrow();
  });

  it('rejects duplicate identifiers across blocks', () => {
    const duplicateField = {
      ...valid[0],
      id: 'second',
      groups: [{ ...valid[0].groups[0], id: 'secondAuthor' }],
    };
    expect(() => validateMetadata([...valid, duplicateField])).toThrow(/duplicate field id: authorIdentifier/i);
  });
});

it('counts fields across groups and builds a hierarchy path', () => {
  const blocks = validateMetadata(valid);
  expect(countFields(blocks)).toBe(1);
  expect(getFieldPath(blocks[0], blocks[0].groups[0], blocks[0].groups[0].fields[0])).toBe(
    'Citation Metadata › Author › Identifier',
  );
});

it('validates the demonstration dataset', () => {
  const blocks = validateMetadata(demoMetadata);
  expect(blocks).toHaveLength(4);
  expect(countFields(blocks)).toBe(14);
});
