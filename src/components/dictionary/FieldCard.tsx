import { Search } from 'lucide-react';

import { HighlightText } from '@/components/dictionary/HighlightText';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { MetadataField } from '@/lib/metadata';
import type { FieldMatch } from '@/lib/search';
import { cn } from '@/lib/utils';

interface FieldCardProps {
  field: MetadataField;
  match?: FieldMatch;
  onSelect(opener: HTMLButtonElement): void;
}

// GitHub Primer accent colors (accent/danger/done/neutral), 10% tint w/ tinted text + border.
const badgeColor = {
  type: 'border-[#0969da]/30 bg-[#0969da]/10 text-[#0969da] dark:border-[#4493f8]/40 dark:bg-[#0969da]/15 dark:text-[#4493f8]',
  repeatable: 'border-[#8250df]/30 bg-[#8250df]/10 text-[#8250df] dark:border-[#a475f9]/40 dark:bg-[#8250df]/15 dark:text-[#a475f9]',
} as const;

// Best-practice badge tracks the recommendation tier, not a flat color: Recommended gets a
// done green, Optional gets a neutral gray. Required is never rendered — the "* Required"
// marker in the top-right corner already says it, and the data never marks a field
// best-practice-required without also making it schema-required.
const bestPracticeColor: Record<string, string> = {
  Recommended:
    'border-[#1a7f37]/30 bg-[#1a7f37]/10 text-[#1a7f37] dark:border-[#3fb950]/40 dark:bg-[#1a7f37]/15 dark:text-[#3fb950]',
};
const bestPracticeColorDefault =
  'border-[#656d76]/30 bg-[#656d76]/10 text-[#656d76] dark:border-[#9198a1]/40 dark:bg-[#656d76]/15 dark:text-[#9198a1]';

export function FieldCard({ field, match, onSelect }: FieldCardProps) {
  const isMatch = match !== undefined;

  return (
    <Card className={cn('h-full', isMatch && 'bg-primary/5 ring-2 ring-primary/35')}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="min-w-0 flex-1">
            <h4>
              <HighlightText text={field.name} ranges={match?.ranges.name} />
            </h4>
          </CardTitle>
          {field.required && (
            <p className="text-xs font-medium text-[#cf222e] dark:text-[#f85149]">
              <span aria-hidden="true">* </span>Required
            </p>
          )}
          {isMatch && (
            <Badge
              variant="secondary"
              className="h-auto max-w-full gap-1 whitespace-normal break-words text-left"
              aria-label="Search match"
            >
              <Search aria-hidden="true" />
              Search match
            </Badge>
          )}
        </div>
        <CardDescription>
          <HighlightText text={field.definition} ranges={match?.ranges.definition} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-wrap content-start gap-2">
        <Badge
          variant="outline"
          className={cn('h-auto max-w-full whitespace-normal break-words text-left', badgeColor.type)}
        >
          {field.type}
        </Badge>
        {field.repeatable && (
          <Badge
            variant="outline"
            className={cn('h-auto max-w-full whitespace-normal break-words text-left', badgeColor.repeatable)}
          >
            Repeatable
          </Badge>
        )}
        {field.recommendation && field.recommendation !== 'Required' && (
          <Badge
            variant="outline"
            className={cn(
              'h-auto max-w-full whitespace-normal break-words text-left',
              bestPracticeColor[field.recommendation] ?? bestPracticeColorDefault,
            )}
          >
            Best practice: {field.recommendation}
          </Badge>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => onSelect(event.currentTarget)}
          aria-label={`View details for ${field.name}`}
        >
          View details
        </Button>
      </CardFooter>
    </Card>
  );
}
