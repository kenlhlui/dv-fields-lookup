# Metadata Lookup

Metadata Lookup is a static Astro application for searching and browsing Dataverse-style metadata fields without losing their block and group context. It renders the complete dictionary by default, preserves sibling fields around search matches, and exposes full field details in an accessible dialog.

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
