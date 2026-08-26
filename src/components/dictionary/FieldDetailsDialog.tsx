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
import type { MetadataBlock, MetadataField, MetadataGroup } from '@/lib/metadata';

export interface SelectedField {
  block: MetadataBlock;
  group: MetadataGroup;
  field: MetadataField;
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
          <DialogHeader>
            <DialogTitle>{selected.field.name}</DialogTitle>
            <DialogDescription>{selected.field.description}</DialogDescription>
          </DialogHeader>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-muted-foreground">Identifier</dt>
              <dd className="mt-1 font-mono text-xs">{selected.field.id}</dd>
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
          </dl>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Example</h3>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
              <code>{selected.field.example}</code>
            </pre>
          </div>

          {selected.field.aliases.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Aliases</h3>
              <div className="flex flex-wrap gap-2">
                {selected.field.aliases.map((alias) => (
                  <Badge key={alias} variant="secondary">
                    {alias}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <h3 className="text-sm font-medium">Path</h3>
            <p className="text-sm text-muted-foreground">
              {getFieldPath(selected.block, selected.group, selected.field)}
            </p>
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
