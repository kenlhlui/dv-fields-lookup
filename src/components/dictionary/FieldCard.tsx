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
    <Card className={cn(isMatch && 'bg-primary/5 ring-2 ring-primary/35')}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>
            <h4>
              <HighlightText text={field.name} ranges={match?.ranges.name} />
            </h4>
          </CardTitle>
          {isMatch && (
            <Badge variant="secondary" className="gap-1" aria-label="Search match">
              <Search aria-hidden="true" />
              Search match
            </Badge>
          )}
        </div>
        <CardDescription>
          <HighlightText text={field.summary} ranges={match?.ranges.summary} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant="outline">Type: {field.type}</Badge>
        {field.required && <Badge variant="outline">Required</Badge>}
        {field.repeatable && <Badge variant="outline">Repeatable</Badge>}
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
