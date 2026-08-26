import type { ReactNode } from 'react';

import type { TextRange } from '@/lib/search';

interface HighlightTextProps {
  text: string;
  ranges?: readonly TextRange[];
}

function mergeRanges(text: string, ranges: readonly TextRange[]): TextRange[] {
  const lastIndex = text.length - 1;
  const validRanges = ranges
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && start <= end && end >= 0 && start <= lastIndex)
    .map(([start, end]) => [Math.max(0, start), Math.min(lastIndex, end)] as TextRange)
    .sort(([leftStart, leftEnd], [rightStart, rightEnd]) => leftStart - rightStart || leftEnd - rightEnd);

  return validRanges.reduce<TextRange[]>((merged, [start, end]) => {
    const previous = merged.at(-1);
    if (previous && start <= previous[1]) {
      merged[merged.length - 1] = [previous[0], Math.max(previous[1], end)];
    } else {
      merged.push([start, end]);
    }
    return merged;
  }, []);
}

export function HighlightText({ text, ranges = [] }: HighlightTextProps) {
  const mergedRanges = mergeRanges(text, ranges);
  const segments: ReactNode[] = [];
  let cursor = 0;

  for (const [start, end] of mergedRanges) {
    if (cursor < start) {
      segments.push(text.slice(cursor, start));
    }
    segments.push(
      <mark key={`${start}-${end}`} className="rounded-sm bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/40">
        {text.slice(start, end + 1)}
      </mark>,
    );
    cursor = end + 1;
  }

  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return <>{segments}</>;
}
