/// <reference types="vitest/config" />

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getViteConfig } from 'astro/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default getViteConfig({
  resolve: { alias: { '@': path.resolve(root, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
