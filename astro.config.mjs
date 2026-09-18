// @ts-check
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kenlhlui.github.io',
  base: '/dv-fields-lookup',
  // Locale ids are lowercase so the config id, the URL segment, Astro.currentLocale and the
  // <html lang> value are all one string — BCP-47 tags are case-insensitive, so lang="zh-hk"
  // is equivalent to zh-HK. Keep this list in sync with `languages` in src/i18n/ui.ts.
  i18n: {
    locales: ['en', 'zh-hk'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
