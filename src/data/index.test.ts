import { describe, expect, it } from 'vitest';

import { localeData } from '@/data';

type Overrides = Record<string, Record<string, string>>;

const en = localeData('en');
const zh = localeData('zh-hk');

describe('localeData', () => {
  it('returns the authored English data unchanged for the default locale', () => {
    const overrides = en.overrides as Overrides;
    expect(overrides.alternativeTitle.bestPracticeDefinition).toBe(
      'Tip: Acronym, short form, or translation of full title.',
    );
    expect(en.facetDescriptions.required).toBe('System required fields to publish a dataset');
  });

  it('merges a partial locale entry per key, inheriting untranslated properties from English', () => {
    const enOverrides = en.overrides as Overrides;
    const zhOverrides = zh.overrides as Overrides;

    // alternativeTitle translates only bestPracticeDefinition in src/data/zh-hk/.
    expect(zhOverrides.alternativeTitle.bestPracticeDefinition).toBe('提示：完整標題的縮寫、簡稱或譯名。');
    expect(zhOverrides.alternativeTitle.example).toBe(enOverrides.alternativeTitle.example);
    expect(zhOverrides.alternativeTitle.recommendation).toBe(enOverrides.alternativeTitle.recommendation);
  });

  it('falls back wholesale to English for a field the locale has not translated', () => {
    const enOverrides = en.overrides as Overrides;
    const zhOverrides = zh.overrides as Overrides;
    expect(zhOverrides.weighting).toEqual(enOverrides.weighting);
  });

  it('keeps recommendation values as canonical English tokens in every locale', () => {
    // Filtering and badge colours in MetadataDictionary/FieldCard match on these exact strings.
    const tokens = new Set(
      Object.values(zh.overrides as Overrides)
        .map((entry) => entry.recommendation)
        .filter(Boolean),
    );
    expect([...tokens].sort()).toEqual(['Optional', 'Recommended', 'Required']);
  });

  it('preserves English block key order, which is the block display order', () => {
    expect(Object.keys(zh.blockDescriptions as Record<string, string>)).toEqual(
      Object.keys(en.blockDescriptions as Record<string, string>),
    );
  });

  it('translates every facet description', () => {
    expect(zh.facetDescriptions.required).toBe('發佈數據集時，必須填寫嘅欄位。');
    expect(zh.facetDescriptions.metadataBlock).not.toBe(en.facetDescriptions.metadataBlock);
  });
});
