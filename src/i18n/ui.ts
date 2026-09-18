// Every user-facing string in the app lives in src/i18n/locales/<locale>.json — flat key/value
// files that non-developers and Weblate can edit directly. Field names, definitions and
// controlled vocabulary come from src/data/metadata.json instead and are never translated;
// the curated best-practice layer lives in src/data/<locale>/*.yaml.
//
// Any key a locale leaves out (or leaves empty) falls back to English, so a partial translation
// is shippable. Adding a locale takes five steps across this file, astro.config.mjs, src/data/,
// src/content/ and src/pages/ — see docs/internationalization.md.

import en from '@/i18n/locales/en.json';
import zhHk from '@/i18n/locales/zh-hk.json';

export const defaultLang = 'en';

// Native-language labels for the language switcher. Kept short — they sit in the page header.
export const languages = {
  en: 'English',
  'zh-hk': '繁體中文',
} as const;

export const ui = {
  en,
  'zh-hk': zhHk,
};
