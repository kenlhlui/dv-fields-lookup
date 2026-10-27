import { describe, expect, it } from 'vitest';

import { cn, toggleInSet } from '@/lib/utils';

describe('cn', () => {
  it('resolves conflicting Tailwind utility classes', () => {
    expect(cn('px-2 text-sm', false && 'hidden', 'px-4')).toBe('text-sm px-4');
  });
});

describe('toggleInSet', () => {
  it('adds a missing value and removes a present one', () => {
    const added = toggleInSet(new Set(['a']), 'b');
    expect(added).toEqual(new Set(['a', 'b']));
    expect(toggleInSet(added, 'a')).toEqual(new Set(['b']));
  });

  it('returns a new set and leaves the original unchanged', () => {
    const original = new Set(['a']);
    const toggled = toggleInSet(original, 'a');
    expect(toggled).not.toBe(original);
    expect(original).toEqual(new Set(['a']));
  });
});
