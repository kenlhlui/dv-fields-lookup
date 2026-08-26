# Metadata Lookup Design

## Summary

Build a static, one-page metadata lookup application with Astro 7, Tailwind CSS 4, shadcn/ui, React, Fuse.js, and a local JSON dataset. The page behaves as a searchable data dictionary: it shows the complete metadata hierarchy by default, narrows the visible metadata blocks during search, preserves sibling fields for context, highlights matching fields and text, and exposes full field details in an accessible dialog.

The first release uses a clearly labeled demonstration dataset. Its schema and UI boundaries are designed so a real metadata dataset can replace it without changing the search interface.

## Goals

- Make every metadata field browsable without requiring a search.
- Help users find fields by name, identifier, aliases, descriptions, and examples.
- Preserve each result's hierarchical context instead of presenting isolated search hits.
- Provide concise field cards with complete details on demand.
- Work as a static site with no backend, CMS, or runtime network requests.
- Deploy reliably to GitHub Pages under the repository base path.
- Remain usable with a keyboard, assistive technology, and narrow screens.

## Non-goals

- Loading or editing live Dataverse schemas.
- User accounts, saved searches, analytics, or server-side APIs.
- Content management or administrative editing.
- URL-synchronized or persisted search state in the first release.
- Dark mode in the first release.
- Command-palette search, accordions, tooltips, or custom scroll areas until a demonstrated interaction requires them.

## Technology and Package Management

Keep the existing Astro 7 project and add React through Astro's official integration. Complete the existing Tailwind CSS 4 Vite-plugin configuration and initialize shadcn/ui using its existing-Astro-project setup. Add Fuse.js for client-side fuzzy search.

Standardize the repository on pnpm. Remove `package-lock.json`, retain `pnpm-lock.yaml`, and configure automation to invoke pnpm explicitly.

Only install the shadcn/ui primitives required by the first version:

- Input
- Card
- Badge
- Button
- Dialog
- Separator

The site is statically generated. Astro owns the document shell and page metadata; a single hydrated React island owns all dictionary interactivity.

## Architecture

```text
Astro layout and index page
└── MetadataDictionary React island
    ├── Search input and result summary
    ├── Ranked metadata block list
    │   ├── Metadata group headings
    │   └── Context-preserving field cards
    ├── No-results state
    └── Field details dialog
```

A single React island is preferable to several islands because the search query, Fuse results, block ordering, highlights, result count, and selected dialog field are one cohesive state model. Splitting those concerns across islands would require cross-island coordination without producing a meaningful benefit for this one-page application.

Astro passes the validated local dataset to the React island as serializable data. No React component imports an Astro component.

## File and Module Boundaries

```text
src/data/metadata.json
    Demonstration metadata records only.

src/lib/metadata.ts
    Dataset types, validation, hierarchy helpers, and aggregate counts.

src/lib/search.ts
    Fuse configuration, normalized matches, block ranking, and highlight ranges.

src/components/dictionary/
    React feature components for the dictionary, search, blocks, cards,
    no-results state, highlighting, and details dialog.

src/components/ui/
    shadcn/ui-generated primitives. Feature behavior does not live here.

src/styles/global.css
    Tailwind import, design tokens, base typography, and global page styles.

src/layouts/Layout.astro
    HTML document, metadata, favicon references, and global stylesheet import.

src/pages/index.astro
    One-page shell and hydrated MetadataDictionary integration.
```

Search and metadata transformations remain independent of React so they can be unit-tested without rendering components.

## Demonstration Data Model

The initial JSON file contains realistic but explicitly demonstrative metadata. It includes blocks such as Citation Metadata, Geospatial Metadata, Social Science Metadata, and Astronomy Metadata. Citation Metadata includes nested groups such as Author and Other Identifier.

Conceptual structure:

```text
MetadataBlock
├── id: string
├── name: string
├── description: string
└── groups: MetadataGroup[]
    ├── id: string
    ├── name: string
    └── fields: MetadataField[]
        ├── id: string
        ├── name: string
        ├── summary: string
        ├── description: string
        ├── type: string
        ├── required: boolean
        ├── repeatable: boolean
        ├── example: string
        └── aliases: string[]
```

Identifiers are unique within the full dataset. Every block and group has at least one field. Text shown on a card comes from `summary`; the dialog uses `description` and the remaining detailed attributes.

The metadata loader validates required properties, value types, nonempty group/field collections, and identifier uniqueness. Invalid local data produces a contextual error during development and production builds rather than a partially rendered dictionary.

## Interface

The page uses a restrained application layout with a readable maximum width, a clear heading, a short purpose statement, and a prominent inline search input above the dictionary. The input is not sticky in the first version.

Below the input, a live summary displays the total number of fields and metadata blocks when the query is empty. During search it displays the number of matching fields and visible blocks.

Each metadata block contains its name, description, field count, group headings, and field cards. A field card shows:

- Field name
- Concise summary
- Field type badge
- Required badge when applicable
- Repeatable badge when applicable
- A clear details action

Selecting the details action opens a modal containing the field name, complete description, machine identifier, type, required and repeatable values, example value, aliases when present, and breadcrumb-like hierarchy path.

On narrow screens, cards use one column, badges wrap beneath the field name, dialog content scrolls within the viewport, and controls retain comfortable touch targets.

## Search Behavior

With an empty or whitespace-only query, bypass Fuse.js and render all blocks, groups, and fields in source order.

For a nonempty query, Fuse.js searches these field properties with intentional weighting:

1. Field name
2. Field identifier and aliases
3. Summary
4. Full description
5. Example

The exact threshold and weights are implementation constants in `src/lib/search.ts` and are covered by behavior-focused tests. They may be tuned using the demonstration dataset without changing component APIs.

Search processing follows this sequence:

1. Normalize the query and request Fuse results with scores and match indices.
2. Associate each result with its block, group, and field.
3. Remove blocks that contain no matching fields.
4. Rank remaining blocks by their strongest field match, using source order as a stable tie-breaker.
5. Preserve every group and sibling field inside a visible block so users retain structural context.
6. Mark matching field cards distinctly and highlight matched text fragments where match indices are available.

Nonmatching sibling cards remain visually neutral. Groups within a visible block remain in source order. A query that produces no field matches replaces the dictionary with a no-results message and a clear-search action.

Highlight rendering escapes and segments source strings rather than injecting HTML. Matching status is conveyed with a label or icon treatment as well as color, satisfying non-color accessibility requirements.

## Interaction and Accessibility

- Associate a visible label with the search input and provide descriptive placeholder text.
- Give the result summary an appropriate polite live region so result-count changes are announced without interrupting typing.
- Use semantic headings for block and group hierarchy.
- Use actual buttons for details and clear-search actions.
- Preserve visible focus indicators and logical tab order.
- Rely on the shadcn Dialog primitive for focus trapping, Escape-to-close behavior, accessible title/description association, and focus restoration.
- Ensure dialog content is scrollable at small viewport heights.
- Do not rely on color alone to identify matches, field requirements, or repeatability.
- Respect reduced-motion preferences; no important behavior depends on animation.

## State and Data Flow

The `MetadataDictionary` island owns only two mutable values: the current query and the selected field, if a dialog is open. The Fuse index is derived once from the validated dataset. Visible blocks and result counts are derived from the dataset, query, and search results rather than stored as separate state.

```text
validated JSON
    ↓
serialized Astro prop
    ↓
React island creates Fuse index
    ↓
query → normalized results → visible ranked blocks
    ↓
cards render context and highlights
    ↓
selected field → details dialog
```

Search state is deliberately not written to the URL or browser storage in the first release. There are no runtime fetches and therefore no loading spinner or network retry state.

## Error and Empty States

- Invalid metadata fails the build with the location and reason when available.
- An empty dataset is invalid and fails validation.
- A valid dataset with an empty query displays the complete dictionary.
- A nonempty query with no matches displays the query, a concise explanation, and a clear-search button.
- Optional display values such as aliases are omitted cleanly when their arrays are empty; required schema values are never silently substituted.

## Visual Direction

Use a light, neutral shadcn-style palette with strong typography, subtle borders, modest corner radii, and restrained shadows. Metadata blocks should read as sections rather than generic marketplace listings. Field cards use compact spacing so the full dictionary remains scannable. Match emphasis must be noticeable without overwhelming the surrounding sibling context.

## Testing and Verification

Unit tests cover pure metadata and search behavior:

- Dataset validation accepts valid data and rejects missing, mistyped, empty, or duplicate records.
- Empty queries return every block in source order.
- Search covers each indexed property.
- Blocks without matches disappear.
- Visible blocks retain all sibling fields and groups.
- Blocks rank by strongest match with stable tie-breaking.
- Match ranges are normalized safely for text highlighting.

React component tests cover:

- Initial full-dictionary rendering and counts.
- Typing a query, receiving ranked blocks, and seeing highlighted matches.
- Sibling retention and unrelated-block removal.
- No-results rendering and clearing the search.
- Opening and closing field details with mouse and keyboard interactions.
- Dialog content for required, repeatable, example, aliases, and hierarchy values.

Completion verification runs the repository's test command, `astro check`, and the production build. A manual preview checks responsive layouts, keyboard navigation, focus restoration, dialog scrolling, and representative searches. If the development server is needed, start it in background mode as required by the repository instructions and manage it with Astro's background-server commands.

## GitHub Pages Deployment

Add the official Astro GitHub Pages workflow and configure it explicitly for pnpm. Configure Astro with:

- `site: "https://kenlhlui.github.io"`
- `base: "/dv-fields-lookup"`

Asset and internal-link references must honor Astro's base path. The GitHub workflow builds on pushes to `main` and also supports manual dispatch. GitHub repository settings still need GitHub Actions selected as the Pages source.

## Acceptance Criteria

- The built page initially shows every demonstration metadata block, group, and field.
- Search is prominent, inline, and usable immediately after hydration.
- Searching removes blocks with no matching fields.
- Every visible matching block retains its sibling fields and hierarchy.
- Matching cards and matched text are visually and semantically distinguishable.
- Field cards remain concise and open complete details in an accessible dialog.
- The no-results state can reset the query.
- The interface works at mobile and desktop widths and is keyboard operable.
- No application backend or runtime data request is required.
- Tests, Astro type checking, and the production build pass under pnpm.
- The generated static site works under the `/dv-fields-lookup` GitHub Pages base path.
