# Dataverse Metadata Field Lookup

[![CI](https://github.com/kenlhlui/dv-fields-lookup/actions/workflows/ci.yml/badge.svg)](https://github.com/kenlhlui/dv-fields-lookup/actions/workflows/ci.yml) ![Astro](https://img.shields.io/badge/astro-2C2052?logo=astro&logoColor=white) ![Zed](https://img.shields.io/badge/zed-084CCF?logo=zedindustries&logoColor=white) ![React](https://img.shields.io/badge/react-61DAFB?logo=react&logoColor=black) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-06B6D4?logo=tailwindcss&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-3178C6?logo=typescript&logoColor=white) ![Vitest](https://img.shields.io/badge/vitest-6E9F18?logo=vitest&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white) ![The Dataverse Project](https://img.shields.io/badge/The_Dataverse_Project-C55B28?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNjIuNCA1MDAiPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xNDIuMSAyNTguN2gtLjFsLTIyLTk5LjNjMjgtMTMuNCA0Ny40LTQyIDQ3LjQtNzUuMSAwLTQ2LTM3LjMtODMuMi04My4yLTgzLjJTMSAzOC4zIDEgODQuMnMzNy4zIDgzLjIgODMuMiA4My4yYzEgMCAxLjkgMCAyLjktLjFsMjEuMyA5Ni4xQzU4LjQgMjc4LjEgMjIgMzI0LjIgMjIgMzc4LjggMjIgNDQ1LjIgNzUuOCA0OTkgMTQyLjEgNDk5czEyMC4yLTUzLjggMTIwLjItMTIwLjItNTMuOC0xMjAuMS0xMjAuMi0xMjAuMU04NC4yIDE0MmMtMzEuOSAwLTU3LjgtMjUuOS01Ny44LTU3LjhzMjUuOS01Ny44IDU3LjgtNTcuOFMxNDIgNTIuMyAxNDIgODQuMiAxMTYuMSAxNDIgODQuMiAxNDJtNTcuOSAzMjMuMWMtNDcuNyAwLTg2LjMtMzguNi04Ni4zLTg2LjNzMzguNi04Ni4zIDg2LjMtODYuMyA4Ni4zIDM4LjYgODYuMyA4Ni4zLTM4LjYgODYuMy04Ni4zIDg2LjMiLz48L3N2Zz4%3D)

<p align="center">
  <img src="docs/demo.png" alt="Image Description" width="600">
</p>

Dataverse Metadata Field Lookup is a static Astro application for searching and browsing metadata blocks and fields in a Dataverse installation, with specifications and context.

The audience of this tool is primarily:
1. Researchers - to understand the available fields when depositing data, and to learn best practices for using them.
2. Curators - to understand the available fields when curating/reviewing datasets.

## Features
- Search the definitions of metadata fields and blocks in a Dataverse installation.
- Full-text search across each field's added context, including best practices and examples.
- Browse available metadata fields by block.
- Filter fields by metadata block, required-only, and best practice tier (Recommended/Optional).


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
## Data

### Metadata schema

Astro validates `src/data/metadata.json` at render time, so real metadata can replace the demonstration dataset without touching the application shell, as long as it matches the expected shape. See [docs/schema.md](docs/schema.md) for that schema, or [src/lib/metadata.ts](src/lib/metadata.ts) for the TypeScript types.

To check the data before a build or deployment:

```bash
pnpm test src/lib/metadata.test.ts
```

## Deployment

You can deploy the application to any static hosting service. For example, to deploy to GitHub Pages:

1. Fork this repository.

2. Change the `site` value in [`astro.config.mjs`](astro.config.mjs) to your GitHub Pages URL:

    ```js
    export default defineConfig({
      site: 'https://<your-github-username>.github.io',
      // ...
    });
    ```

3. Change the relevant values in [`src/site.config.ts`](src/site.config.ts), especially `description`, `dataverseName`, `dataverseURL`, and `githubUrl`:

    ```ts
    export const site = {
      description: 'Search and explore metadata fields in {YOUR-DATAVERSE-NAME}, with specifications and best practices in context.',
      dataverseName: '{YOUR-DATAVERSE-NAME}',
      dataverseURL: '{YOUR-DATAVERSE-URL}',
      githubUrl: 'https://github.com/{YOUR-GITHUB-USERNAME}/dv-fields-lookup',
      // ...
    };
    ```

4. Replace [`src/data/metadata.json`](src/data/metadata.json) with the JSON exported from your Dataverse installation with either:
   1. The `/api/metadatablocks?returnDatasetFieldTypes=true` endpoint, which returns all metadata blocks and fields from the installation, or
      1. Example: [https://demo.borealisdata.ca/api/metadatablocks?returnDatasetFieldTypes=true](https://borealisdata.ca/api/metadatablocks?returnDatasetFieldTypes=true)
   2. The `/api/dataverses/{id}/metadatablocks?returnDatasetFieldTypes=true` endpoint, which returns all metadata blocks and fields from a collection.
      1. Example: [https://demo.borealisdata.ca/api/dataverses/toronto/metadatablocks?returnDatasetFieldTypes=true](https://borealisdata.ca/api/dataverses/toronto/metadatablocks?returnDatasetFieldTypes=true)

5. Add best practice definitions and examples for individual fields in [`src/data/metadata.overrides.yaml`](src/data/metadata.overrides.yaml). Look up the field's `name` in `src/data/metadata.json`, then add an entry keyed by that name:

    ```yaml
    alternativeTitle:
      bestPracticeDefinition: 'Tip: Acronym, short form, or translation of full title.'
      recommendation: Optional
      example: Youth Social Media Survey
    ```

6. Add metadata block names and descriptions in [`src/data/block-descriptions.yaml`](src/data/block-descriptions.yaml). The block names are the `name` values in `src/data/metadata.json`:

    ```yaml
    citation: >-
    The core metadata needed to publish a dataset in a Dataverse repository. The
    required fields in this block are used to create the citation for the
    dataset. Compliant with DDI Lite, DDI 2.5 Codebook, DataCite 3.1, and Dublin
    Core's DCMI Metadata Terms. The Language field uses ISO 639-1 controlled
    vocabulary.
    ```

    The order of the blocks determines their display order in the application. Blocks with no description are displayed last, without a description.

7. Commit and push your changes. Make sure the repository's Pages settings are set to deploy from GitHub Actions.

## Acknowledgments
The best practice definitions, recommendations, and examples (see [`src/data/metadata.overrides.yaml`](src/data/metadata.overrides.yaml)) are from the [Dataverse North Metadata Best Practices Guide v 3.0](https://doi.org/10.5281/zenodo.5668945), license under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## License
[Apache License 2.0](LICENSE)