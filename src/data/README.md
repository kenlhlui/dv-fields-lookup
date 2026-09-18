## Layout

```
metadata.json          raw Dataverse API export — not localized
en/                    default locale, the source of truth
  metadata.overrides.yaml
  block-descriptions.yaml
  facet-descriptions.yaml
zh-hk/                 translations; only the keys that differ from en/
  …same three files
```

`metadata.json` is the raw Dataverse `/api/metadatablocks?returnDatasetFieldTypes=true` export — copy the fresh export over this file to update it, no build step needed. It is **not** translated: field names, definitions and controlled vocabulary come from the installation and render in English in every locale.

`src/lib/metadata.ts`'s `buildMetadata(metadataJson, overrides, blockDescriptions)` flattens it at runtime into the shape the app uses: compound fields become id-prefixed leaf entries (e.g. `author.authorName`), `metadata.overrides.yaml` (keyed by leaf field name) merges in curated `bestPracticeDefinition`/`recommendation`/`example`, and `block-descriptions.yaml` (keyed by block id) supplies block descriptions, which aren't part of the API response.

`facet-descriptions.yaml` supplies the one-line blurbs shown under the "Required" and "Best practice" filters in `MetadataDictionary`. Unrelated to the API data — it is passed to the component as a prop, not merged through `buildMetadata`.

## How locales merge

`localeData(lang)` in [`index.ts`](index.ts) resolves the three files for one locale by merging them over `en/`, so **a translation file only carries the keys it actually translates**:

- `metadata.overrides.yaml` merges per field *and* per property. An entry that supplies only `bestPracticeDefinition` keeps the English `recommendation` and `example`.
- `block-descriptions.yaml` and `facet-descriptions.yaml` merge per key.
- A field, block or facet the locale never mentions falls back to English wholesale.

English key order is preserved by the merge. That matters: `block-descriptions.yaml`'s key order is the **block display order** in `buildMetadata`, so reordering `en/block-descriptions.yaml` reorders the page, while reordering a translation file changes nothing.

## Do not translate `recommendation`

`Required` / `Recommended` / `Optional` are canonical tokens, not display text. The best-practice filter buttons in `MetadataDictionary.tsx`, the badge colours in `FieldCard.tsx`, and the `!== 'Required'` check that hides a redundant badge all match on those exact English strings. Translating them in the YAML silently breaks filtering.

Keep them English in every locale and leave them out of translation files entirely. The visible labels come from the `tier.*` keys in [`src/i18n/ui.ts`](../i18n/ui.ts), applied at render time by `tierLabel()`.

## Adding a locale

See the Internationalization section of the [root README](../../README.md#internationalization).
