import { Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { BlockNav } from '@/components/dictionary/BlockNav';
import { FieldDetailsDialog, type SelectedField } from '@/components/dictionary/FieldDetailsDialog';
import { MetadataBlockSection } from '@/components/dictionary/MetadataBlockSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MetadataBlock, MetadataField } from '@/lib/metadata';
import { createMetadataSearch, getVisibleFields } from '@/lib/search';

const bestPracticeTiers = ['Recommended', 'Optional'] as const;

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function toggleInSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
}

export default function MetadataDictionary({ blocks }: { blocks: MetadataBlock[] }) {
  const [query, setQuery] = useState('');
  const [blockFilter, setBlockFilter] = useState<ReadonlySet<string>>(new Set());
  const [requiredOnly, setRequiredOnly] = useState(false);
  const [bestPracticeFilter, setBestPracticeFilter] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<SelectedField | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const metadataSearch = useMemo(() => createMetadataSearch(blocks), [blocks]);
  const view = useMemo(() => metadataSearch.search(query), [metadataSearch, query]);

  function fieldFilter(field: MetadataField): boolean {
    if (requiredOnly && !field.required) return false;
    if (bestPracticeFilter.size > 0 && !(field.recommendation && bestPracticeFilter.has(field.recommendation))) {
      return false;
    }
    return true;
  }

  const blockFiltered =
    blockFilter.size > 0 ? view.blocks.filter((result) => blockFilter.has(result.block.id)) : view.blocks;
  const visibleBlocks = blockFiltered.filter((result) => getVisibleFields(result, fieldFilter).length > 0);
  const isEmpty = visibleBlocks.length === 0;

  const fieldCount = visibleBlocks.reduce((total, result) => total + getVisibleFields(result, fieldFilter).length, 0);
  const summary = `${fieldCount} ${view.isSearching ? 'matching ' : ''}${pluralize(fieldCount, 'field')} · ${visibleBlocks.length} ${pluralize(visibleBlocks.length, 'metadata block')}`;
  const hasActiveFilters = query || blockFilter.size > 0 || requiredOnly || bestPracticeFilter.size > 0;

  function selectField(block: MetadataBlock, field: MetadataField, opener: HTMLButtonElement) {
    restoreFocusRef.current = opener;
    setSelected({ block, field });
  }

  function clearSearch() {
    setQuery('');
    setBlockFilter(new Set());
    setRequiredOnly(false);
    setBestPracticeFilter(new Set());
    searchInputRef.current?.focus();
  }

  return (
    <div className="space-y-8">
      <BlockNav blocks={visibleBlocks.map((result) => result.block)} />
      <div className="space-y-3">
        <label htmlFor="metadata-search" className="text-sm font-medium">
          Search metadata fields
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              ref={searchInputRef}
              id="metadata-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search names, descriptions, identifiers, and examples…"
              className="h-10 pl-9"
            />
          </div>
          {hasActiveFilters && (
            <Button type="button" variant="outline" className="h-10" onClick={clearSearch}>
              Clear all
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by metadata block">
          {blocks.map((block) => (
            <Button
              key={block.id}
              type="button"
              variant={blockFilter.has(block.id) ? 'default' : 'outline'}
              size="sm"
              aria-pressed={blockFilter.has(block.id)}
              onClick={() => setBlockFilter((current) => toggleInSet(current, block.id))}
            >
              {block.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by required">
          <Button
            type="button"
            variant={requiredOnly ? 'default' : 'outline'}
            size="sm"
            aria-pressed={requiredOnly}
            onClick={() => setRequiredOnly((current) => !current)}
          >
            Required
          </Button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by best practice">
          {bestPracticeTiers.map((tier) => (
            <Button
              key={tier}
              type="button"
              variant={bestPracticeFilter.has(tier) ? 'default' : 'outline'}
              size="sm"
              aria-pressed={bestPracticeFilter.has(tier)}
              onClick={() => setBestPracticeFilter((current) => toggleInSet(current, tier))}
            >
              {tier}
            </Button>
          ))}
        </div>
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {isEmpty
            ? view.isSearching
              ? `No metadata fields matched “${view.normalizedQuery}”`
              : 'No metadata fields match the selected filters'
            : summary}
        </p>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border p-6" aria-label="No search results">
          <p>
            {view.isSearching
              ? `No metadata fields matched “${view.normalizedQuery}”`
              : 'No metadata fields match the selected filters'}
          </p>
          <p className="text-muted-foreground">
            {view.isSearching ? 'Try a different search term or clear the current search.' : 'Try different filters or clear them.'}
          </p>
          <Button className="mt-4" variant="outline" onClick={clearSearch}>
            {view.isSearching ? 'Clear search' : 'Clear filters'}
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {visibleBlocks.map((result) => (
            <MetadataBlockSection key={result.block.id} result={result} onSelectField={selectField} fieldFilter={fieldFilter} />
          ))}
        </div>
      )}

      <FieldDetailsDialog
        selected={selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
        restoreFocusRef={restoreFocusRef}
      />
    </div>
  );
}
