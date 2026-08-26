import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const globalCss = readFileSync(path.resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('global responsive styles', () => {
  it('keeps buttons and inputs touch-sized whenever the primary pointer is coarse', () => {
    expect(globalCss).toContain('@media (pointer: coarse)');
    expect(globalCss).toMatch(/button,\s*input\s*{[^}]*min-height:\s*2\.75rem/s);
    expect(globalCss).toMatch(/button\s*{[^}]*min-width:\s*2\.75rem/s);
  });
});
