import type * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getFieldPath } from '@/lib/metadata';
import type { MetadataBlock, MetadataField } from '@/lib/metadata';

export interface SelectedField {
  block: MetadataBlock;
  // bestPracticeDefinitionHtml is computed at build time (see index.astro), not part of
  // the data dictionary schema in @/lib/metadata — kept out of it so that schema stays a
  // pure description of authored/sourced field data.
  field: MetadataField & { bestPracticeDefinitionHtml?: string };
}

interface FieldDetailsDialogProps {
  selected: SelectedField | null;
  onOpenChange(open: boolean): void;
  restoreFocusRef: React.RefObject<HTMLElement | null>;
}

export function FieldDetailsDialog({ selected, onOpenChange, restoreFocusRef }: FieldDetailsDialogProps) {
  return (
    <Dialog open={selected !== null} onOpenChange={onOpenChange}>
      {selected && (
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocusRef.current?.focus();
          }}
        >
          <DialogHeader className="pr-10">
            <DialogTitle>{selected.field.name}</DialogTitle>
            <DialogDescription>{selected.field.definition}</DialogDescription>
          </DialogHeader>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-muted-foreground">Identifier</dt>
              <dd className="mt-1 font-mono text-xs break-words">{selected.field.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Type</dt>
              <dd className="mt-1">{selected.field.type}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Required</dt>
              <dd className="mt-1">{selected.field.required ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Repeatable</dt>
              <dd className="mt-1">{selected.field.repeatable ? 'Yes' : 'No'}</dd>
            </div>
            {selected.field.recommendation && (
              <div>
                <dt className="font-medium text-muted-foreground">Best practice</dt>
                <dd className="mt-1">{selected.field.recommendation}</dd>
              </div>
            )}
          </dl>

          <Separator />

          {selected.field.bestPracticeDefinitionHtml ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Best practice definition</h3>
              <div
                className="space-y-2 text-sm text-muted-foreground [&_a:hover]:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
                // eslint-disable-next-line react/no-danger -- trusted, build-time content from metadata.overrides.yaml
                dangerouslySetInnerHTML={{ __html: selected.field.bestPracticeDefinitionHtml }}
              />
            </div>
          ) : null}

          {selected.field.example ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Example</h3>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                <code>{selected.field.example}</code>
              </pre>
            </div>
          ) : null}

          {selected.field.values?.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Allowed values</h3>
              <div className="flex flex-wrap gap-2">
                {selected.field.values.map((value) => (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="h-auto max-w-full whitespace-normal break-words text-left"
                  >
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <h3 className="text-sm font-medium">Path</h3>
            <p className="text-sm text-muted-foreground">{getFieldPath(selected.block, selected.field)}</p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
