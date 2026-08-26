import { Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { FieldDetailsDialog, type SelectedField } from '@/components/dictionary/FieldDetailsDialog';
import { MetadataBlockSection } from '@/components/dictionary/MetadataBlockSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { countFields, type MetadataBlock, type MetadataField, type MetadataGroup } from '@/lib/metadata';
import { createMetadataSearch } from '@/lib/search';

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export default function MetadataDictionary({ blocks }: { blocks: MetadataBlock[] }) {
  const [query, setQuery] = useState('');
  const [blockFilter, setBlockFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedField | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const metadataSearch = useMemo(() => createMetadataSearch(blocks), [blocks]);
  const view = useMemo(() => metadataSearch.search(query), [metadataSearch, query]);
  const visibleBlocks = blockFilter ? view.blocks.filter((result) => result.block.id === blockFilter) : view.blocks;

  const fieldCount = view.isSearching
    ? visibleBlocks.reduce((total, result) => total + result.matches.size, 0)
    : countFields(visibleBlocks.map((result) => result.block));
  const summary = `${fieldCount} ${view.isSearching ? 'matching ' : ''}${pluralize(fieldCount, 'field')} · ${visibleBlocks.length} ${pluralize(visibleBlocks.length, 'metadata block')}`;

  function selectField(block: MetadataBlock, group: MetadataGroup, field: MetadataField, opener: HTMLButtonElement) {
    restoreFocusRef.current = opener;
    setSelected({ block, group, field });
  }

  function clearSearch() {
    setQuery('');
    setBlockFilter(null);
    searchInputRef.current?.focus();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <label htmlFor="metadata-search" className="text-sm font-medium">
          Search metadata fields
        </label>
        <div className="relative">
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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by metadata block">
          {blocks.map((block) => (
            <Button
              key={block.id}
              type="button"
              variant={blockFilter === block.id ? 'default' : 'outline'}
              size="sm"
              aria-pressed={blockFilter === block.id}
              onClick={() => setBlockFilter((current) => (current === block.id ? null : block.id))}
            >
              {block.name}
            </Button>
          ))}
        </div>
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {view.isSearching && visibleBlocks.length === 0
            ? `No metadata fields matched “${view.normalizedQuery}”`
            : summary}
        </p>
      </div>

      {view.isSearching && visibleBlocks.length === 0 ? (
        <div className="rounded-lg border p-6" aria-label="No search results">
          <p>No metadata fields matched “{view.normalizedQuery}”</p>
          <p className="text-muted-foreground">Try a different search term or clear the current search.</p>
          <Button className="mt-4" variant="outline" onClick={clearSearch}>
            Clear search
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {visibleBlocks.map((result) => (
            <MetadataBlockSection key={result.block.id} result={result} onSelectField={selectField} />
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
