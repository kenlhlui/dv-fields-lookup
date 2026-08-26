# Metadata Lookup

Metadata Lookup is a static Astro application for searching and browsing Dataverse-style metadata fields. It renders the complete dictionary by default, narrows each visible block to its matching fields while searching, and exposes full field details in an accessible dialog.

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

## Data and deployment

The site deploys to GitHub Pages under the `/dv-fields-lookup/` base path. Astro validates `src/data/metadata.json` during rendering, so real metadata can replace the demonstration dataset later without changing the application shell as long as it satisfies the validated metadata shape in `src/lib/metadata.ts`.

Deployment runs via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main` and on manual workflow dispatch. The one required one-time repository setting: in **Settings → Pages**, set **Source** to **GitHub Actions**.


## Acknowledgments
The bestPracticeDefinition text is from the [Dataverse North Metadata Best Practices Guide v 3.0](https://doi.org/10.5281/zenodo.5668945), license under CC-BY 4.0.