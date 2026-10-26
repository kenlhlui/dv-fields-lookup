import Fuse, { type FuseResult, type FuseResultMatch, type IFuseOptions } from 'fuse.js';

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
  // Typo-tolerant matches for fields not already in `blocks`, shown apart so a near-miss like
  // "contract" for `contact` is visible without being mistaken for an exact hit.
  similarBlocks: SearchBlock[];
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

// True if text[index] begins a word: after a non-alphanumeric, at a camelCase hump (`producer|URL`,
// `ID|Type`), or on a Han character, since Chinese has no spaces to mark word boundaries.
function isWordStart(text: string, index: number): boolean {
  const current = text[index] ?? '';
  const previous = text[index - 1] ?? '';
  const next = text[index + 1] ?? '';
  const isUpper = (char: string) => /\p{Lu}/u.test(char);
  const isLower = (char: string) => /\p{Ll}/u.test(char);

  return (
    index === 0 ||
    !/[\p{L}\p{N}]/u.test(previous) ||
    /\p{Script=Han}/u.test(current) ||
    (isUpper(current) && (isLower(previous) || (isUpper(previous) && isLower(next))))
  );
}

// Index of the last character of the word that starts at `start`, stopping at a camelCase hump.
function wordEnd(text: string, start: number): number {
  let end = start;
  while (end + 1 < text.length && /[\p{L}\p{N}]/u.test(text[end + 1]) && !isWordStart(text, end + 1)) {
    end += 1;
  }
  return end;
}

// `wholeWords` widens each range to the end of its word: a typo match only covers the letters that
// lined up, so "contract" found by `contact` would otherwise highlight just "cont".
function rangesFor(matches: ReadonlyArray<FuseResultMatch> | undefined, wholeWords = false): FieldMatch['ranges'] {
  const ranges: FieldMatch['ranges'] = {};

  for (const match of matches ?? []) {
    if (!match.key || !matchableProperties.has(match.key as MatchableProperty)) {
      continue;
    }

    // Fuse matches substrings anywhere, so `city` would hit "velocity"; keep only matches that start a word.
    const text = match.value ?? '';
    const indices = match.indices
      .filter(([start]) => isWordStart(text, start))
      .map(([start, end]) => [start, wholeWords ? Math.max(end, wordEnd(text, start)) : end] as const);
    if (indices.length === 0) {
      continue;
    }

    const key = match.key as MatchableProperty;
    ranges[key] = normalizeRanges([...(ranges[key] ?? []), ...indices]);
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
  const fuseOptions = {
    // Match each query word independently so keyword queries work in any order and across fields.
    useTokenSearch: true,
    tokenMatch: 'all',
    includeMatches: true,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: searchKeys,
  } satisfies IFuseOptions<SearchRecord>;
  // Exact matches lead; typo-tolerant matches are kept separate so `contact` doesn't mix "contract" into
  // its results, while `subjct` still finds "subject".
  const exactFuse = new Fuse(records, { ...fuseOptions, threshold: 0 });
  // Below 0.2 so words of five letters or fewer must match exactly; longer words still allow one typo.
  const fuzzyFuse = new Fuse(records, { ...fuseOptions, threshold: 0.17 });

  function groupResults(
    results: FuseResult<SearchRecord>[],
    { exclude, wholeWords = false }: { exclude?: ReadonlySet<string>; wholeWords?: boolean } = {},
  ): SearchBlock[] {
    const groupedBlocks = new Map<number, SearchBlock>();
    for (const result of results) {
      const ranges = rangesFor(result.matches, wholeWords);
      if (Object.keys(ranges).length === 0 || exclude?.has(result.item.field.id)) {
        continue;
      }

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
        ranges,
      });
      groupedBlocks.set(result.item.blockIndex, searchBlock);
    }

    return [...groupedBlocks.values()].sort(
      (left, right) => left.bestScore - right.bestScore || left.sourceIndex - right.sourceIndex,
    );
  }

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
          similarBlocks: [],
        };
      }

      // Split camelCase so a pasted identifier like `authorAffiliation` also matches the name "Author Affiliation".
      const tokenQuery = normalizedQuery.replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2');
      const searchBlocks = groupResults(exactFuse.search(tokenQuery));
      const exactFieldIds = new Set(searchBlocks.flatMap((block) => [...block.matches.keys()]));
      const similarBlocks = groupResults(fuzzyFuse.search(tokenQuery), {
        exclude: exactFieldIds,
        wholeWords: true,
      });

      return {
        isSearching: true,
        normalizedQuery,
        matchingFieldCount: searchBlocks.reduce((total, block) => total + block.matches.size, 0),
        blocks: searchBlocks,
        similarBlocks,
      };
    },
  };
}
