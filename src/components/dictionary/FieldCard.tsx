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
import { tierLabel, useTranslations, type Lang } from '@/i18n/utils';
import type { MetadataField } from '@/lib/metadata';
import type { FieldMatch } from '@/lib/search';
import { cn } from '@/lib/utils';

interface FieldCardProps {
  field: MetadataField;
  match?: FieldMatch;
  onSelect(opener: HTMLButtonElement): void;
  lang: Lang;
  // h3 when the card sits directly under a block's h2, h4 inside a compound group's h3.
  headingLevel?: 3 | 4;
}

// GitHub Primer accent colors (accent/danger/done/neutral), 10% tint + border; light text uses the
// darker emphasis shade so it holds 4.5:1 on the matched-card tint too.
const badgeColor = {
  type: 'border-[#0969da]/30 bg-[#0969da]/10 text-[#0550ae] dark:border-[#4493f8]/40 dark:bg-[#0969da]/15 dark:text-[#4493f8]',
  repeatable: 'border-[#8250df]/30 bg-[#8250df]/10 text-[#6639ba] dark:border-[#a475f9]/40 dark:bg-[#8250df]/15 dark:text-[#bc8cff]',
} as const;

// Best-practice badge tracks the recommendation tier, not a flat color: Recommended gets a
// done green, Optional gets a neutral gray. Required is never rendered — the "* Required"
// marker in the top-right corner already says it, and the data never marks a field
// best-practice-required without also making it schema-required.
const bestPracticeColor: Record<string, string> = {
  Recommended:
    'border-[#1a7f37]/30 bg-[#1a7f37]/10 text-[#116329] dark:border-[#3fb950]/40 dark:bg-[#1a7f37]/15 dark:text-[#3fb950]',
};
const bestPracticeColorDefault =
  'border-[#656d76]/30 bg-[#656d76]/10 text-[#59636e] dark:border-[#9198a1]/40 dark:bg-[#656d76]/15 dark:text-[#9198a1]';

export function FieldCard({ field, match, onSelect, lang, headingLevel = 3 }: FieldCardProps) {
  const t = useTranslations(lang);
  const Heading = `h${headingLevel}` as const;
  const isMatch = match !== undefined;

  return (
    <Card className={cn('h-full', isMatch && 'bg-primary/5 ring-2 ring-primary/35')}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="min-w-0 flex-1">
            <Heading>
              <HighlightText text={field.name} ranges={match?.ranges.name} />
            </Heading>
          </CardTitle>
          {field.required && (
            <p className="text-xs font-medium text-[#cf222e] dark:text-[#f85149]">
              <span aria-hidden="true">* </span>
              {t('card.required')}
            </p>
          )}
          {isMatch && (
            <Badge
              variant="secondary"
              className="h-auto max-w-full gap-1 whitespace-normal break-words text-left"
              aria-label={t('card.searchMatch')}
            >
              <Search aria-hidden="true" />
              {t('card.searchMatch')}
            </Badge>
          )}
        </div>
        <CardDescription>
          <HighlightText text={field.definition} ranges={match?.ranges.definition} />
        </CardDescription>
        {field.bestPracticeDefinition && match?.ranges.bestPracticeDefinition && (
          <CardDescription>
            <span className="font-medium text-foreground">{t('card.bestPracticePrefix')}</span>
            <HighlightText text={field.bestPracticeDefinition} ranges={match.ranges.bestPracticeDefinition} />
          </CardDescription>
        )}
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
            {t('card.repeatable')}
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
            {t('card.bestPracticeBadge', { tier: tierLabel(t, field.recommendation) })}
          </Badge>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => onSelect(event.currentTarget)}
          aria-label={t('card.viewDetailsFor', { name: field.name })}
        >
          {t('card.viewDetails')}
        </Button>
      </CardFooter>
    </Card>
  );
}
