import { execFileSync } from 'node:child_process';

export interface Commit {
  sha: string;
  date: Date;
}

/**
 * The last commit that touched `path`, read from git at build time. Needs full git history — in
 * a shallow clone this reports the HEAD commit instead. Returns undefined when git isn't available.
 */
export function getLastCommit(path: string): Commit | undefined {
  try {
    const [sha, date] = execFileSync('git', ['log', '-1', '--format=%H%n%cI', '--', path], {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n');
    return sha ? { sha, date: new Date(date) } : undefined;
  } catch {
    return undefined;
  }
}
