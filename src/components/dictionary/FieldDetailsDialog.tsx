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
import { tierLabel, useTranslations, type Lang } from '@/i18n/utils';
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
  lang: Lang;
}

export function FieldDetailsDialog({ selected, onOpenChange, restoreFocusRef, lang }: FieldDetailsDialogProps) {
  const t = useTranslations(lang);

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
              <dt className="font-medium text-muted-foreground">{t('details.identifier')}</dt>
              <dd className="mt-1 font-mono text-xs break-words">{selected.field.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">{t('details.type')}</dt>
              <dd className="mt-1">{selected.field.type}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">{t('details.required')}</dt>
              <dd className="mt-1">{t(selected.field.required ? 'details.yes' : 'details.no')}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">{t('details.repeatable')}</dt>
              <dd className="mt-1">{t(selected.field.repeatable ? 'details.yes' : 'details.no')}</dd>
            </div>
            {selected.field.recommendation && (
              <div>
                <dt className="font-medium text-muted-foreground">{t('details.bestPractice')}</dt>
                <dd className="mt-1">{tierLabel(t, selected.field.recommendation)}</dd>
              </div>
            )}
          </dl>

          <Separator />

          {selected.field.bestPracticeDefinitionHtml ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('details.bestPracticeDefinition')}</h3>
              <div
                className="space-y-2 text-sm text-muted-foreground [&_a:hover]:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
                // eslint-disable-next-line react/no-danger -- trusted, build-time content from metadata.overrides.yaml
                dangerouslySetInnerHTML={{ __html: selected.field.bestPracticeDefinitionHtml }}
              />
            </div>
          ) : null}

          {selected.field.example ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('details.example')}</h3>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                <code>{selected.field.example}</code>
              </pre>
            </div>
          ) : null}

          {selected.field.values?.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('details.allowedValues')}</h3>
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
            <h3 className="text-sm font-medium">{t('details.path')}</h3>
            <p className="text-sm text-muted-foreground">{getFieldPath(selected.block, selected.field)}</p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('details.close')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
