import { FieldCard } from '@/components/dictionary/FieldCard';
import { Separator } from '@/components/ui/separator';
import type { MetadataBlock, MetadataField, MetadataGroup } from '@/lib/metadata';
import type { SearchBlock } from '@/lib/search';

interface MetadataBlockSectionProps {
  result: SearchBlock;
  onSelectField(block: MetadataBlock, group: MetadataGroup, field: MetadataField, opener: HTMLButtonElement): void;
}

export function MetadataBlockSection({ result, onSelectField }: MetadataBlockSectionProps) {
  const fieldCount = result.block.groups.reduce((count, group) => count + group.fields.length, 0);

  return (
    <section aria-labelledby={`metadata-block-${result.block.id}`} className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id={`metadata-block-${result.block.id}`} className="text-2xl font-semibold tracking-tight">
            {result.block.name}
          </h2>
          <p className="text-sm text-muted-foreground">{fieldCount} fields</p>
        </div>
        <p className="max-w-3xl text-muted-foreground">{result.block.description}</p>
      </header>
      <Separator />
      {result.block.groups.map((group) => (
        <div key={group.id} className="space-y-3">
          <h3 className="text-lg font-medium">{group.name}</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.fields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                match={result.matches.get(field.id)}
                onSelect={(opener) => onSelectField(result.block, group, field, opener)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
