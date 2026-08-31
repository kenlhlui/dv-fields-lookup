import Fuse, { type FuseResultMatch } from 'fuse.js';

import { countFields, type MetadataBlock, type MetadataField } from '@/lib/metadata';

export type TextRange = readonly [start: number, end: number];

export interface FieldMatch {
  fieldId: string;
  score: number;
  ranges: Partial<Record<'id' | 'name' | 'definition' | 'bestPracticeDefinition' | 'example', TextRange[]>>;
}

export interface SearchBlock {
  block: MetadataBlock;
  matches: Map<string, FieldMatch>;
  bestScore: number;
  sourceIndex: number;
}

export interface SearchView {
  isSearching: boolean;
  normalizedQuery: string;
  matchingFieldCount: number;
  blocks: SearchBlock[];
}

interface SearchRecord {
  blockIndex: number;
  field: MetadataField;
  id: string;
  name: string;
  definition: string;
  bestPracticeDefinition: string;
  example: string;
}

type MatchableProperty = keyof FieldMatch['ranges'];
type SearchProperty = 'id' | 'name' | 'definition' | 'bestPracticeDefinition' | 'example';

const matchableProperties = new Set<MatchableProperty>([
  'id',
  'name',
  'definition',
  'bestPracticeDefinition',
  'example',
]);
const searchKeys: { name: SearchProperty; weight: number }[] = [
  { name: 'name', weight: 0.35 },
  { name: 'id', weight: 0.2 },
  { name: 'definition', weight: 0.18 },
  { name: 'bestPracticeDefinition', weight: 0.17 },
  { name: 'example', weight: 0.1 },
];

function normalizeRanges(indices: ReadonlyArray<readonly [number, number]>): TextRange[] {
  const ranges = indices
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end))
    .map(([start, end]) => [Math.min(start, end), Math.max(start, end)] as TextRange)
    .sort(([leftStart, leftEnd], [rightStart, rightEnd]) => leftStart - rightStart || leftEnd - rightEnd);

  return ranges.reduce<TextRange[]>((merged, [start, end]) => {
    const previous = merged.at(-1);
    if (previous && start <= previous[1] + 1) {
      merged[merged.length - 1] = [previous[0], Math.max(previous[1], end)];
    } else {
      merged.push([start, end]);
    }
    return merged;
  }, []);
}

function rangesFor(matches: ReadonlyArray<FuseResultMatch> | undefined): FieldMatch['ranges'] {
  const ranges: FieldMatch['ranges'] = {};

  for (const match of matches ?? []) {
    if (!match.key || !matchableProperties.has(match.key as MatchableProperty)) {
      continue;
    }

    const key = match.key as MatchableProperty;
    ranges[key] = normalizeRanges([...(ranges[key] ?? []), ...match.indices]);
  }

  return ranges;
}

// Fields a block should render: narrowed to search matches (if any), then to fieldFilter (facets).
// Shared by MetadataDictionary (counts) and MetadataBlockSection (rendering) so both agree.
export function getVisibleFields(
  result: SearchBlock,
  fieldFilter?: (field: MetadataField) => boolean,
): MetadataField[] {
  const fields =
    result.matches.size > 0 ? result.block.fields.filter((field) => result.matches.has(field.id)) : result.block.fields;
  return fieldFilter ? fields.filter(fieldFilter) : fields;
}

export function createMetadataSearch(blocks: MetadataBlock[]): { search(query: string): SearchView } {
  const records: SearchRecord[] = blocks.flatMap((block, blockIndex) =>
    block.fields.map((field) => ({
      blockIndex,
      field,
      id: field.id,
      name: field.name,
      definition: field.definition,
      bestPracticeDefinition: field.bestPracticeDefinition ?? '',
      example: field.example ?? '',
    })),
  );
  const fuse = new Fuse(records, {
    includeMatches: true,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
    threshold: 0.2,
    keys: searchKeys,
  });

  return {
    search(query) {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        return {
          isSearching: false,
          normalizedQuery,
          matchingFieldCount: countFields(blocks),
          blocks: blocks.map((block, sourceIndex) => ({
            block,
            matches: new Map(),
            bestScore: 0,
            sourceIndex,
          })),
        };
      }

      const groupedBlocks = new Map<number, SearchBlock>();
      for (const result of fuse.search(normalizedQuery)) {
        const score = result.score ?? 1;
        const current = groupedBlocks.get(result.item.blockIndex);
        const searchBlock = current ?? {
          block: blocks[result.item.blockIndex],
          matches: new Map(),
          bestScore: score,
          sourceIndex: result.item.blockIndex,
        };
        const existing = searchBlock.matches.get(result.item.field.id);

        searchBlock.bestScore = Math.min(searchBlock.bestScore, score);
        searchBlock.matches.set(result.item.field.id, {
          fieldId: result.item.field.id,
          score: Math.min(existing?.score ?? score, score),
          ranges: rangesFor(result.matches),
        });
        groupedBlocks.set(result.item.blockIndex, searchBlock);
      }

      const searchBlocks = [...groupedBlocks.values()].sort(
        (left, right) => left.bestScore - right.bestScore || left.sourceIndex - right.sourceIndex,
      );

      return {
        isSearching: true,
        normalizedQuery,
        matchingFieldCount: searchBlocks.reduce((total, block) => total + block.matches.size, 0),
        blocks: searchBlocks,
      };
    },
  };
}
