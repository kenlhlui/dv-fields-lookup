import { Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { BlockNav } from '@/components/dictionary/BlockNav';
import { FieldDetailsDialog, type SelectedField } from '@/components/dictionary/FieldDetailsDialog';
import { MetadataBlockSection } from '@/components/dictionary/MetadataBlockSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { FacetDescriptions } from '@/data';
import { plural, useTranslations, type Lang } from '@/i18n/utils';
import type { MetadataBlock, MetadataField } from '@/lib/metadata';
import { createMetadataSearch, getVisibleFields } from '@/lib/search';

// Canonical tokens as authored in metadata.overrides.yaml, never translated in the data —
// filtering and badge colours match on them. Display labels come from the tier.* keys.
const bestPracticeTiers = ['Recommended', 'Optional'] as const;

function toggleInSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
}

interface MetadataDictionaryProps {
  blocks: MetadataBlock[];
  // Locale-resolved on the server and passed in, so the yaml parser stays out of the client bundle.
  facetDescriptions: FacetDescriptions;
  lang: Lang;
}

export default function MetadataDictionary({ blocks, facetDescriptions, lang }: MetadataDictionaryProps) {
  const t = useTranslations(lang);
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
  const summary = t(view.isSearching ? 'summary.searching' : 'summary.browsing', {
    fields: fieldCount,
    fieldWord: plural(t, fieldCount, 'count.field.one', 'count.field.other'),
    blocks: visibleBlocks.length,
    blockWord: plural(t, visibleBlocks.length, 'count.block.one', 'count.block.other'),
  });
  const emptyMessage = view.isSearching
    ? t('search.emptyQuery', { query: view.normalizedQuery })
    : t('search.emptyFilters');
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
      <BlockNav blocks={visibleBlocks.map((result) => result.block)} lang={lang} />
      <div className="space-y-3">
        <label htmlFor="metadata-search" className="text-xl font-medium gap-1 flex items-center">
          {t('search.label')}
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
              placeholder={t('search.placeholder')}
              className="h-10 pl-9"
            />
          </div>
          {hasActiveFilters && (
            <Button type="button" variant="outline" className="h-10" onClick={clearSearch}>
              {t('search.clearAll')}
            </Button>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-md font-medium text-muted-foreground">{t('facet.metadataBlock')}</p>
          <p className="text-sm text-muted-foreground">{facetDescriptions.metadataBlock}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('facet.filterByBlock')}>
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
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-md font-medium text-muted-foreground">{t('facet.required')}</p>
          <p className="text-sm text-muted-foreground">{facetDescriptions.required}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('facet.filterByRequired')}>
            <Button
              type="button"
              variant={requiredOnly ? 'default' : 'outline'}
              size="sm"
              aria-pressed={requiredOnly}
              onClick={() => setRequiredOnly((current) => !current)}
            >
              {t('facet.required')}
            </Button>
          </div>
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-md font-medium text-muted-foreground">{t('facet.bestPractice')}</p>
          {/* ponytail: static, repo-authored yaml, not user input — safe to render as HTML */}
          <p
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: facetDescriptions.bestPractice }}
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('facet.filterByBestPractice')}>
            {bestPracticeTiers.map((tier) => (
              <Button
                key={tier}
                type="button"
                variant={bestPracticeFilter.has(tier) ? 'default' : 'outline'}
                size="sm"
                aria-pressed={bestPracticeFilter.has(tier)}
                onClick={() => setBestPracticeFilter((current) => toggleInSet(current, tier))}
              >
                {t(`tier.${tier}`)}
              </Button>
            ))}
          </div>
        </div>
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {isEmpty ? emptyMessage : summary}
        </p>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border p-6" aria-label={t('search.noResultsLabel')}>
          <p>{emptyMessage}</p>
          <p className="text-muted-foreground">
            {view.isSearching ? t('search.emptyQueryHint') : t('search.emptyFiltersHint')}
          </p>
          <Button className="mt-4" variant="outline" onClick={clearSearch}>
            {view.isSearching ? t('search.clearSearch') : t('search.clearFilters')}
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {visibleBlocks.map((result) => (
            <MetadataBlockSection
              key={result.block.id}
              result={result}
              onSelectField={selectField}
              fieldFilter={fieldFilter}
              lang={lang}
            />
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
        lang={lang}
      />
    </div>
  );
}
