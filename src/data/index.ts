import { load } from 'js-yaml';
import { z } from 'zod';

import { defaultLang } from '@/i18n/ui';
import type { Lang } from '@/i18n/utils';

// ponytail: every locale's yaml is parsed once at module load; all six files together are a
// few hundred KB of text and this module is only imported where the merged dataset is built.
const files = import.meta.glob('./*/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

const facetDescriptionsSchema = z.object({
  metadataBlock: z.string(),
  required: z.string(),
  bestPractice: z.string(),
});

type Dict = Record<string, unknown>;

function read(lang: string, name: string): Dict {
  const raw = files[`./${lang}/${name}.yaml`];
  return raw ? ((load(raw) as Dict | undefined) ?? {}) : {};
}

/**
 * Shallow per-key merge. English key order is preserved because spreading `base` first fixes
 * the insertion order of every key it defines — block-descriptions.yaml's key order is the
 * block display order in buildMetadata(), so this must not be reordered.
 */
function mergeShallow(base: Dict, locale: Dict): Dict {
  return { ...base, ...locale };
}

/**
 * Two-level merge for metadata.overrides.yaml: a locale entry supplying only
 * `bestPracticeDefinition` keeps the English `recommendation` and `example`.
 */
function mergeEntries(base: Dict, locale: Dict): Dict {
  const merged: Dict = { ...base };
  for (const [key, value] of Object.entries(locale)) {
    const existing = merged[key];
    merged[key] =
      existing && typeof existing === 'object' && value && typeof value === 'object'
        ? { ...(existing as Dict), ...(value as Dict) }
        : value;
  }
  return merged;
}

/**
 * The curated, translatable data layer for one locale, merged over the default locale so a
 * translation file only has to carry the keys it actually translates. Raw Dataverse data
 * (src/data/metadata.json) is not localized and is loaded separately.
 */
export function localeData(lang: Lang) {
  const overrides = mergeEntries(read(defaultLang, 'metadata.overrides'), read(lang, 'metadata.overrides'));
  const blockDescriptions = mergeShallow(read(defaultLang, 'block-descriptions'), read(lang, 'block-descriptions'));
  const facetDescriptions = facetDescriptionsSchema.parse(
    mergeShallow(read(defaultLang, 'facet-descriptions'), read(lang, 'facet-descriptions')),
  );

  return { overrides: overrides as unknown, blockDescriptions: blockDescriptions as unknown, facetDescriptions };
}

export type FacetDescriptions = z.infer<typeof facetDescriptionsSchema>;
