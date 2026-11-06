// @vitest-environment node
// Under the default jsdom environment the node:child_process mock isn't applied and real git runs.

import { execFileSync } from 'node:child_process';

import { describe, expect, it, vi } from 'vitest';

import { getLastCommit } from '@/lib/git';

vi.mock(import('node:child_process'), async (importOriginal) => ({
  ...(await importOriginal()),
  execFileSync: vi.fn(),
}));
const git = vi.mocked(execFileSync);

describe('getLastCommit', () => {
  it('parses the sha and commit date', () => {
    git.mockReturnValueOnce('88258d9abc\n2026-11-06T08:55:31Z\n');
    expect(getLastCommit('src/data/metadata.json')).toEqual({
      sha: '88258d9abc',
      date: new Date('2026-11-06T08:55:31Z'),
    });
  });

  it('returns undefined when the path has no commits', () => {
    git.mockReturnValueOnce('');
    expect(getLastCommit('untracked.json')).toBeUndefined();
  });

  it('returns undefined when git is unavailable', () => {
    git.mockImplementationOnce(() => {
      throw new Error('spawn git ENOENT');
    });
    expect(getLastCommit('src/data/metadata.json')).toBeUndefined();
  });
});
