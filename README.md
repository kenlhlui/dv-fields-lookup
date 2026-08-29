# Dataverse Metadata Field Lookup

Dataverse Metadata Field Lookup is a static Astro application for searching and browsing Dataverse-style metadata fields. It renders the complete dictionary by default, narrows each visible block to its matching fields while searching, and exposes full field details in an accessible dialog.

> [!IMPORTANT]
> The bundled metadata is demonstration data. It is not canonical Dataverse documentation.

## Prerequisites

- Node.js 22.12.0 or newer
- [pnpm](https://pnpm.io/)

## Development

Install dependencies:

```bash
pnpm install
```

Start Astro's background development server and manage it with:

```bash
pnpm astro dev --background
pnpm astro dev status
pnpm astro dev logs
pnpm astro dev stop
```

Run automated verification and create a production build:

```bash
pnpm test
pnpm check
pnpm build
```

## Release
This repository uses [release-it](https://github.com/release-it/release-it) to automate versioning and changelog generation. To create a new release, run:

```bash
pnpm release
```

## Data and deployment

The site deploys to GitHub Pages under the `/dv-fields-lookup/` base path.

### Metadata source files

The field dictionary is built at render time from three files under [`src/data/`](src/data/), via `buildMetadata()` in [`src/lib/metadata.ts`](src/lib/metadata.ts):

| File | What it is | How to update it |
| --- | --- | --- |
| `metadata.json` | The raw Dataverse API export — a straight copy of `res/metadatablocks.json`, no hand edits. | Fetch `/api/metadatablocks?returnDatasetFieldTypes=true` from a Dataverse instance and copy the response over this file. |
| `metadata.overrides.yaml` | Curated, per-field additions: `bestPracticeDefinition`, `recommendation`, `example`. Keyed by each field's **leaf name** (e.g. `authorAffiliation`, not `author.authorAffiliation`), so one entry applies wherever that field name appears. | Edit by hand. Add or change a top-level key matching the field's leaf name; any of the three properties may be omitted. |
| `block-descriptions.yaml` | One description per metadata block, keyed by block id (e.g. `citation`, `geospatial`). Not present in the API response. | Edit by hand. Every block returned by the API must have an entry here, or `buildMetadata()` throws at build time. |

Both `.yaml` files are loaded through a matching `.ts` wrapper (`metadata.overrides.ts`, `block-descriptions.ts`) that parses them once at import time — no build step to run after editing either yaml file.

Astro validates the merged result against the schema in `src/lib/metadata.ts`, so a malformed edit to any of the three files fails the build loudly rather than rendering bad data.

Deployment runs via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main` and on manual workflow dispatch. The one required one-time repository setting: in **Settings → Pages**, set **Source** to **GitHub Actions**.

To test the metadata (data source) validity before build or deployment, run:

```bash
pnpm test src/lib/metadata.test.ts
```


## Acknowledgments
The bestPracticeDefinition text is from the [Dataverse North Metadata Best Practices Guide v 3.0](https://doi.org/10.5281/zenodo.5668945), license under CC-BY 4.0.

## License
[Apache License 2.0](LICENSE)