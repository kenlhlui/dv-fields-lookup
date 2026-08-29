import { ChevronDown } from 'lucide-react';

import { FieldCard } from '@/components/dictionary/FieldCard';
import { Separator } from '@/components/ui/separator';
import type { MetadataBlock, MetadataField } from '@/lib/metadata';
import { getVisibleFields, type SearchBlock } from '@/lib/search';

interface MetadataBlockSectionProps {
  result: SearchBlock;
  onSelectField(block: MetadataBlock, field: MetadataField, opener: HTMLButtonElement): void;
  fieldFilter?: (field: MetadataField) => boolean;
}

interface FieldGroup {
  parent?: string;
  fields: MetadataField[];
}

// Compound fields are flattened away in the data (each child becomes its own field), so their
// children are regrouped here under the parent's display name — otherwise e.g. the four Author
// sub-fields read as unrelated top-level fields. Fields keep their source order, which puts a
// compound's children next to each other, so consecutive runs are all that need grouping.
function groupByParent(fields: MetadataField[]): FieldGroup[] {
  return fields.reduce<FieldGroup[]>((groups, field) => {
    const current = groups.at(-1);
    if (current && current.parent === field.parent) {
      current.fields.push(field);
    } else {
      groups.push({ parent: field.parent, fields: [field] });
    }
    return groups;
  }, []);
}

export function MetadataBlockSection({ result, onSelectField, fieldFilter }: MetadataBlockSectionProps) {
  // Searching narrows a block to its matching fields; browsing shows every field (matches is empty).
  // fieldFilter then narrows further by facet (required, best practice).
  const fields = getVisibleFields(result, fieldFilter);
  const fieldCount = fields.length;
  const groups = groupByParent(fields);

  const cards = (group: FieldGroup) => (
    <div className="grid gap-4 md:grid-cols-2">
      {group.fields.map((field) => (
        <FieldCard
          key={field.id}
          field={field}
          match={result.matches.get(field.id)}
          onSelect={(opener) => onSelectField(result.block, field, opener)}
        />
      ))}
    </div>
  );

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
        <div className="space-y-4">
          {groups.map((group) => {
            const headingId = `compound-${result.block.id}-${group.fields[0].id}`;
            return group.parent ? (
              <section
                key={group.fields[0].id}
                aria-labelledby={headingId}
                className="space-y-3 rounded-lg border border-dashed bg-muted/30 p-4"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 id={headingId} className="font-semibold">
                    {group.parent}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Compound field · {group.fields.length} sub-{group.fields.length === 1 ? 'field' : 'fields'}
                  </p>
                </div>
                {cards(group)}
              </section>
            ) : (
              // Same padding as a compound group, minus the visible box, so standalone
              // cards line up with grouped ones instead of sitting 1rem wider.
              <div key={group.fields[0].id} className="rounded-lg border border-transparent p-4">
                {cards(group)}
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
