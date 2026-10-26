import { useEffect, useState } from 'react';

import { useTranslations, type Lang } from '@/i18n/utils';
import type { MetadataBlock } from '@/lib/metadata';
import { cn } from '@/lib/utils';

interface BlockNavProps {
  blocks: MetadataBlock[];
  // Adds a final link to the "Similar matches" section, so it can be reached without tabbing past
  // every exact result.
  similarMatches?: boolean;
  lang: Lang;
}

export function BlockNav({ blocks, similarMatches = false, lang }: BlockNavProps) {
  const t = useTranslations(lang);
  // Keyed by target heading id, so the similar-matches link shares the scroll tracking.
  const items = [
    ...blocks.map((block) => ({ id: `metadata-block-${block.id}`, label: block.name })),
    ...(similarMatches ? [{ id: 'similar-matches', label: t('search.similarHeading') }] : []),
  ];
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);
  const itemIds = items.map((item) => item.id).join('|');

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    const onScroll = () => {
      // Recomputed from live geometry on every tick (not "did a heading just
      // cross a line" events) so a big jump — e.g. the back-to-top button —
      // lands on the right section instead of leaving the old one stuck.
      const detectionLine = window.innerHeight * 0.2;
      let current = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > detectionLine) break;
        current = heading;
      }
      if (current) setActiveId(current.id);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemIds is the stable form of items
  }, [itemIds]);

  if (items.length === 0) return null;

  return (
    <nav
      // Named for its contents: once it links to the similar matches, it's more than a list of blocks.
      aria-label={t(similarMatches ? 'nav.onThisPage' : 'nav.blocks')}
      // A sticky column beside the blocks, only where there's room for one. It never
      // fades out, so what a screen reader reads is always on screen.
      className="sticky top-6 hidden max-h-[calc(100vh-3rem)] self-start overflow-y-auto rounded-lg border border-border bg-background p-2 xl:block"
    >
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? 'location' : undefined}
              className={cn(
                // The global focus outline is pulled inside because the nav scrolls, which would clip it at the edges.
                'block rounded-md border border-transparent px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:-outline-offset-2',
                // The muted fill alone barely shows against the background, so the active item also gets a border tuned per theme.
                activeId === item.id &&
                  'border-foreground/20 bg-muted font-medium text-foreground dark:border-white/35',
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
