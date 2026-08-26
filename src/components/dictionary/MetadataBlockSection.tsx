import { ChevronDown } from 'lucide-react';

import { FieldCard } from '@/components/dictionary/FieldCard';
import { Separator } from '@/components/ui/separator';
import type { MetadataBlock, MetadataField } from '@/lib/metadata';
import type { SearchBlock } from '@/lib/search';

interface MetadataBlockSectionProps {
  result: SearchBlock;
  onSelectField(block: MetadataBlock, field: MetadataField, opener: HTMLButtonElement): void;
}

export function MetadataBlockSection({ result, onSelectField }: MetadataBlockSectionProps) {
  // Searching narrows a block to its matching fields; browsing shows every field (matches is empty).
  const fields =
    result.matches.size > 0 ? result.block.fields.filter((field) => result.matches.has(field.id)) : result.block.fields;
  const fieldCount = fields.length;

  return (
    // section keeps the `region` landmark role; `open` by default so search results and
    // first-visit browsing aren't hidden behind a click.
    <section aria-labelledby={`metadata-block-${result.block.id}`}>
      <details open className="group space-y-6">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 id={`metadata-block-${result.block.id}`} className="text-2xl font-semibold tracking-tight">
                {result.block.name}
              </h2>
              <p className="text-sm text-muted-foreground">{fieldCount} fields</p>
            </div>
            <p className="max-w-3xl text-muted-foreground">{result.block.description}</p>
          </div>
          <ChevronDown
            aria-hidden="true"
            className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </summary>
        <Separator />
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              match={result.matches.get(field.id)}
              onSelect={(opener) => onSelectField(result.block, field, opener)}
            />
          ))}
        </div>
      </details>
    </section>
  );
}
