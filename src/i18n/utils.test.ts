import { describe, expect, it } from 'vitest';

import { languages, ui } from '@/i18n/ui';
import { isLang, plural, tierLabel, toLang, useTranslations } from '@/i18n/utils';

describe('useTranslations', () => {
  it('returns the string for the requested locale', () => {
    expect(useTranslations('en')('details.close')).toBe('Close');
    expect(useTranslations('zh-hk')('details.close')).toBe('關閉');
  });

  it('interpolates named parameters and leaves unknown placeholders alone', () => {
    const t = useTranslations('en');
    expect(t('card.viewDetailsFor', { name: 'Author Name' })).toBe('View details for Author Name');
    expect(t('search.emptyQuery', {})).toBe('No metadata fields matched “{query}”');
  });

  it('falls back to English for a key the locale has not translated', () => {
    // Simulates a partially translated dictionary without depending on one staying incomplete.
    const partial = useTranslations('zh-hk');
    const missing = Object.keys(ui.en).filter((key) => !(key in ui['zh-hk']));
    for (const key of missing) {
      expect(partial(key as keyof typeof ui.en)).toBe(ui.en[key as keyof typeof ui.en]);
    }
  });
});

describe('locale narrowing', () => {
  it('accepts configured locales and rejects anything else', () => {
    expect(isLang('zh-hk')).toBe(true);
    expect(isLang('fr')).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });

  it('falls back to English for an unconfigured locale', () => {
    expect(toLang('zh-hk')).toBe('zh-hk');
    expect(toLang('fr')).toBe('en');
  });

  it('has a switcher label for every locale in the dictionary', () => {
    expect(Object.keys(languages).sort()).toEqual(Object.keys(ui).sort());
  });
});

describe('plural', () => {
  it('picks the singular form only for exactly one', () => {
    const t = useTranslations('en');
    expect(plural(t, 1, 'count.field.one', 'count.field.other')).toBe('field');
    expect(plural(t, 0, 'count.field.one', 'count.field.other')).toBe('fields');
    expect(plural(t, 2, 'count.field.one', 'count.field.other')).toBe('fields');
  });
});

describe('tierLabel', () => {
  it('translates the canonical English recommendation tokens', () => {
    expect(tierLabel(useTranslations('zh-hk'), 'Recommended')).toBe('建議');
    expect(tierLabel(useTranslations('en'), 'Optional')).toBe('Optional');
  });

  it('renders an unrecognised token as-is rather than as a missing key', () => {
    expect(tierLabel(useTranslations('zh-hk'), 'Situational')).toBe('Situational');
  });
});
