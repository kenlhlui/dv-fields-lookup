import { useEffect, useState } from 'react';

import type { MetadataBlock } from '@/lib/metadata';
import { cn } from '@/lib/utils';

// Matches BackToTop's threshold so both floating controls appear together.
const SHOW_AFTER_SCROLL_Y = 400;
// Fade out this long after the last scroll event, so it doesn't sit over content while reading.
const IDLE_HIDE_MS = 3000;

export function BlockNav({ blocks }: { blocks: MetadataBlock[] }) {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<string | undefined>(blocks[0]?.id);
  const blockIds = blocks.map((block) => block.id).join('|');

  useEffect(() => {
    const headings = blocks
      .map((block) => document.getElementById(`metadata-block-${block.id}`))
      .filter((el): el is HTMLElement => el !== null);
    let idleTimer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      const pastThreshold = window.scrollY > SHOW_AFTER_SCROLL_Y;
      setVisible(pastThreshold);
      clearTimeout(idleTimer);
      if (pastThreshold) {
        idleTimer = setTimeout(() => setVisible(false), IDLE_HIDE_MS);
      }

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
      clearTimeout(idleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- blockIds is the stable form of blocks
  }, [blockIds]);

  if (blocks.length === 0) return null;

  return (
    <nav
      aria-label="Metadata blocks"
      className={cn(
        'fixed top-1/2 left-4 z-40 hidden max-h-[70vh] w-56 -translate-x-4 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-background/95 p-2 opacity-0 shadow-lg backdrop-blur pointer-events-none transition-all duration-200 min-[1600px]:block',
        visible && 'translate-x-0 opacity-100 pointer-events-auto',
      )}
    >
      <ul className="space-y-0.5">
        {blocks.map((block) => (
          <li key={block.id}>
            <a
              href={`#metadata-block-${block.id}`}
              aria-current={activeId === block.id ? 'location' : undefined}
              className={cn(
                'block truncate rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground',
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
