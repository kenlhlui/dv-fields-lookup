import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlockNav } from '@/components/dictionary/BlockNav';
import type { MetadataBlock } from '@/lib/metadata';

const blocks = [
  { id: 'citation', name: 'Citation Metadata' },
  { id: 'geospatial', name: 'Geospatial Metadata' },
] as MetadataBlock[];

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => window.dispatchEvent(new Event('scroll')));
}

function positionHeading(id: string, top: number) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  el.getBoundingClientRect = () => ({ top }) as DOMRect;
}

beforeEach(() => {
  document.body.innerHTML = `
    <h2 id="metadata-block-citation"></h2>
    <h2 id="metadata-block-geospatial"></h2>
  `;
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
});

describe('BlockNav', () => {
  afterEach(() => vi.useRealTimers());

  it('stays hidden near the top of the page and floats in once scrolled', () => {
    render(<BlockNav blocks={blocks} />);
    const nav = screen.getByRole('navigation', { name: 'Metadata blocks' });
    expect(nav.className).toMatch(/opacity-0/);

    scrollTo(500);
    expect(nav.className).toMatch(/opacity-100/);

    scrollTo(0);
    expect(nav.className).toMatch(/opacity-0/);
  });

  it('stays hidden until the viewport has enough left gutter to avoid the cards', () => {
    render(<BlockNav blocks={blocks} />);
    const nav = screen.getByRole('navigation', { name: 'Metadata blocks' });

    expect(nav.className).toMatch(/\bhidden\b.*\bmin-\[1600px\]:block\b/);
    expect(nav.className).not.toMatch(/\bmd:block\b/);
  });

  it('fades back out after 3 seconds of no further scrolling', () => {
    vi.useFakeTimers();
    render(<BlockNav blocks={blocks} />);
    const nav = screen.getByRole('navigation', { name: 'Metadata blocks' });

    scrollTo(500);
    expect(nav.className).toMatch(/opacity-100/);

    act(() => vi.advanceTimersByTime(2999));
    expect(nav.className).toMatch(/opacity-100/);

    act(() => vi.advanceTimersByTime(1));
    expect(nav.className).toMatch(/opacity-0/);
  });

  it('marks the block whose heading has scrolled above the detection line as current', () => {
    positionHeading('metadata-block-citation', -900);
    positionHeading('metadata-block-geospatial', 50);
    render(<BlockNav blocks={blocks} />);

    scrollTo(900);

    expect(screen.getByRole('link', { name: 'Geospatial Metadata' })).toHaveAttribute('aria-current', 'location');
  });

  it('snaps back to the first section on a jump to the top, instead of sticking on the old one', () => {
    positionHeading('metadata-block-citation', -900);
    positionHeading('metadata-block-geospatial', 50);
    render(<BlockNav blocks={blocks} />);
    scrollTo(900);
    expect(screen.getByRole('link', { name: 'Geospatial Metadata' })).toHaveAttribute('aria-current', 'location');

    // Simulate the back-to-top jump: both headings are now back below the fold.
    positionHeading('metadata-block-citation', 20);
    positionHeading('metadata-block-geospatial', 900);
    scrollTo(0);

    expect(screen.getByRole('link', { name: 'Citation Metadata' })).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('link', { name: 'Geospatial Metadata' })).not.toHaveAttribute('aria-current');
  });

  it('renders nothing when there are no blocks to navigate', () => {
    const { container } = render(<BlockNav blocks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
