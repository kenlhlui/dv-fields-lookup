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

The site deploys to GitHub Pages under the `/dv-fields-lookup/` base path via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), on every push to `main` and on manual workflow dispatch. One repository setting is required, once: in **Settings → Pages**, set **Source** to **GitHub Actions**.

### Metadata schema

Astro validates `src/data/metadata.json` at render time, so real metadata can replace the demonstration dataset without touching the application shell, as long as it matches the expected shape. See [docs/schema.md](docs/schema.md) for that schema, or [src/lib/metadata.ts](src/lib/metadata.ts) for the TypeScript types.

To check the data before a build or deployment:

```bash
pnpm test src/lib/metadata.test.ts
```

## Acknowledgments
The bestPracticeDefinition text is from the [Dataverse North Metadata Best Practices Guide v 3.0](https://doi.org/10.5281/zenodo.5668945), license under CC-BY 4.0.

## License
[Apache License 2.0](LICENSE)