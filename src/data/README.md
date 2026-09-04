`metadata.json` is the raw Dataverse `/api/metadatablocks?returnDatasetFieldTypes=true` export — copy the fresh export over this file to update it, no build step needed.

`src/lib/metadata.ts`'s `buildMetadata(metadataJson, metadataOverrides, blockDescriptions)` flattens it at runtime into the shape the app uses: compound fields become id-prefixed leaf entries (e.g. `author.authorName`), `metadata.overrides.yaml` (keyed by leaf field name) merges in curated `bestPracticeDefinition`/`recommendation`/`example`, and `block-descriptions.yaml` (keyed by block id) supplies block descriptions, which aren't part of the API response.

`facet-descriptions.yaml` supplies the one-line blurbs shown under the "Required" and "Best practice" filters in `MetadataDictionary`. Unrelated to the API data — loaded directly via `facet-descriptions.ts`, not through `buildMetadata`.
