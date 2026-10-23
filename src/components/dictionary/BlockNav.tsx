import { useEffect, useState } from 'react';

import { useTranslations, type Lang } from '@/i18n/utils';
import type { MetadataBlock } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export function BlockNav({ blocks, lang }: { blocks: MetadataBlock[]; lang: Lang }) {
  const t = useTranslations(lang);
  const [activeId, setActiveId] = useState<string | undefined>(blocks[0]?.id);
  const blockIds = blocks.map((block) => block.id).join('|');

  useEffect(() => {
    const headings = blocks
      .map((block) => document.getElementById(`metadata-block-${block.id}`))
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
      if (current) setActiveId(current.id.replace('metadata-block-', ''));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- blockIds is the stable form of blocks
  }, [blockIds]);

  if (blocks.length === 0) return null;

  return (
    <nav
      aria-label={t('nav.blocks')}
      // A sticky column beside the blocks, only where there's room for one. It never
      // fades out, so what a screen reader reads is always on screen.
      className="sticky top-6 hidden max-h-[calc(100vh-3rem)] self-start overflow-y-auto rounded-lg border border-border bg-background p-2 xl:block"
    >
      <ul className="space-y-0.5">
        {blocks.map((block) => (
          <li key={block.id}>
            <a
              href={`#metadata-block-${block.id}`}
              aria-current={activeId === block.id ? 'location' : undefined}
              className={cn(
                'block rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground',
                activeId === block.id && 'bg-muted font-medium text-foreground',
              )}
            >
              {block.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
