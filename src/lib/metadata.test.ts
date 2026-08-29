import { describe, expect, it } from 'vitest';

import Metadata from '@/data/metadata.json';
import { countFields, getFieldPath, validateMetadata } from '@/lib/metadata';

const valid = [
  {
    id: 'citation',
    name: 'Citation Metadata',
    description: 'Core information used to identify and cite a dataset.',
    fields: [
      {
        id: 'authorIdentifier',
        name: 'Author Identifier',
        definition: 'A globally unique identifier associated with the author.',
        type: 'Text',
        required: false,
        repeatable: true,
        example: 'https://orcid.org/0000-0002-1825-0097',
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
    ['a block without fields', [{ ...valid[0], fields: [] }]],
    ['a field with the wrong required type', [{ ...valid[0], fields: [{ ...valid[0].fields[0], required: 'no' }] }]],
  ])('rejects %s', (_label, input) => {
    expect(() => validateMetadata(input)).toThrow();
  });

  it('rejects duplicate identifiers across blocks', () => {
    const duplicateField = { ...valid[0], id: 'second' };
    expect(() => validateMetadata([...valid, duplicateField])).toThrow(/duplicate field id: authorIdentifier/i);
  });
});

it('counts fields across blocks and builds a hierarchy path', () => {
  const blocks = validateMetadata(valid);
  expect(countFields(blocks)).toBe(1);
  expect(getFieldPath(blocks[0], blocks[0].fields[0])).toBe('Citation Metadata › Author Identifier');
});

it('validates the data source', () => {
  const blocks = validateMetadata(Metadata);
  expect(countFields(blocks)).toBeGreaterThan(blocks.length);
});
