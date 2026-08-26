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
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant="outline" className="h-auto max-w-full whitespace-normal break-words text-left">
          Type: {field.type}
        </Badge>
        {field.required && (
          <Badge variant="outline" className="h-auto max-w-full whitespace-normal break-words text-left">
            Required
          </Badge>
        )}
        {field.repeatable && (
          <Badge variant="outline" className="h-auto max-w-full whitespace-normal break-words text-left">
            Repeatable
          </Badge>
        )}
        {field.recommendation && (
          <Badge variant="outline" className="h-auto max-w-full whitespace-normal break-words text-left">
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
