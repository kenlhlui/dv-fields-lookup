# Metadata Lookup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, accessible metadata dictionary that browses a demonstration schema, performs context-preserving fuzzy search, and deploys under the GitHub Pages repository base path.

**Architecture:** Astro renders the document shell and passes a build-time-validated JSON dataset into one hydrated React island. Pure TypeScript modules own schema validation and Fuse.js ranking; focused React components own presentation, query state, match highlighting, and a shadcn/ui details dialog.

**Tech Stack:** Astro 7, React, TypeScript, Tailwind CSS 4, shadcn/ui, Fuse.js, Zod, Vitest, Testing Library, pnpm, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-26-metadata-lookup-design.md`

## Global Constraints

- Keep Astro at version 7; do not downgrade to an Astro 5 starter.
- Standardize on pnpm and remove `package-lock.json`.
- Generate a static site with no backend, CMS, runtime fetch, URL-synchronized query, or persisted query.
- Use one hydrated React island for all dictionary interactivity.
- Use only the shadcn/ui Input, Card, Badge, Button, Dialog, and Separator primitives in version one.
- Display the complete dictionary in source order when the normalized query is empty.
- During search, remove blocks without matches, rank visible blocks by strongest match, retain all groups and fields in each visible block, and distinguish matched fields without relying on color alone.
- Use `site: "https://kenlhlui.github.io"` and `base: "/dv-fields-lookup"` for GitHub Pages.
- Start any development server with background mode and manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.

---

## Planned File Structure

```text
.github/workflows/deploy.yml               GitHub Pages build and deployment
astro.config.mjs                           React, Tailwind, site, and base configuration
components.json                            shadcn/ui generator configuration
package.json                               pnpm scripts and dependencies
pnpm-lock.yaml                             sole dependency lockfile
tsconfig.json                              strict TypeScript and @/* alias
vitest.config.ts                           jsdom test environment and aliases
src/test/setup.ts                          Testing Library matchers and cleanup
src/styles/global.css                      Tailwind import, shadcn tokens, global styling
src/data/metadata.json                     exact demonstration dataset
src/lib/metadata.ts                        Zod schema, public types, validation, counts
src/lib/metadata.test.ts                   validation and count unit tests
src/lib/search.ts                          Fuse index, ranking, and match-range normalization
src/lib/search.test.ts                     search behavior unit tests
src/lib/utils.ts                           shadcn class-name helper
src/lib/utils.test.ts                      test-harness smoke test
src/components/ui/*                        generated shadcn primitives only
src/components/dictionary/HighlightText.tsx
src/components/dictionary/HighlightText.test.tsx
src/components/dictionary/FieldCard.tsx
src/components/dictionary/MetadataBlockSection.tsx
src/components/dictionary/MetadataBlockSection.test.tsx
src/components/dictionary/FieldDetailsDialog.tsx
src/components/dictionary/FieldDetailsDialog.test.tsx
src/components/dictionary/MetadataDictionary.tsx
src/components/dictionary/MetadataDictionary.test.tsx
src/layouts/Layout.astro                    semantic document shell and metadata
src/pages/index.astro                       page copy and React-island integration
```

Generated shadcn files remain primitive-only. Feature behavior belongs under `src/components/dictionary`, pure transformations under `src/lib`, and records under `src/data`.

### Task 1: Configure the Astro, React, Tailwind, shadcn, and test foundation

**Files:**
- Delete: `package-lock.json`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `astro.config.mjs`
- Modify: `tsconfig.json`
- Create: `components.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/styles/global.css`
- Create: `src/lib/utils.ts`
- Create: `src/lib/utils.test.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/separator.tsx`
- Regenerate: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: The existing Astro 7 starter and Tailwind 4 packages.
- Produces: `cn(...inputs: ClassValue[]): string`, the `@/*` import alias, React hydration support, global Tailwind styles, six shadcn primitives, and `pnpm test` / `pnpm check` scripts.

- [ ] **Step 1: Remove the npm lockfile and install the exact runtime and test categories with pnpm**

Run:

```bash
pnpm add @astrojs/react react react-dom fuse.js zod lucide-react class-variance-authority clsx tailwind-merge
pnpm add -D @astrojs/check @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/react @types/react-dom jsdom typescript vitest
```

Delete `package-lock.json` with an `apply_patch` deletion. In `pnpm-workspace.yaml`, change `allowBuilds.esbuild` to `true` so the committed pnpm policy allows Astro/Vite's build dependency.

- [ ] **Step 2: Configure scripts, Astro integrations, GitHub Pages paths, and aliases**

Set the relevant `package.json` fields to:

```json
{
  "name": "dv-fields-lookup",
  "packageManager": "pnpm@11.24.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "astro check",
    "astro": "astro"
  }
}
```

Preserve the dependency versions selected by pnpm. Configure `astro.config.mjs` as:

```js
// @ts-check
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kenlhlui.github.io',
  base: '/dv-fields-lookup',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

Add these keys under `compilerOptions` in `tsconfig.json`:

```json
{
  "jsx": "react-jsx",
  "jsxImportSource": "react",
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"]
  },
  "resolveJsonModule": true
}
```

- [ ] **Step 3: Initialize shadcn/ui and add only the approved primitives**

Run the existing-project initializer, select Radix UI, the neutral theme, CSS variables, `src/styles/global.css`, and the `@/*` alias, then add the approved components:

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add input card badge button dialog separator
```

Check `components.json` records `src/styles/global.css`, `@/components`, `@/components/ui`, `@/lib`, and `@/lib/utils`. Do not add Command, Accordion, Tooltip, Scroll Area, or a dark-mode toggle.

- [ ] **Step 4: Write the failing test-harness smoke test**

Create `src/lib/utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/utils';

describe('cn', () => {
  it('resolves conflicting Tailwind utility classes', () => {
    expect(cn('px-2 text-sm', false && 'hidden', 'px-4')).toBe('text-sm px-4');
  });
});
```

- [ ] **Step 5: Configure Vitest and verify the smoke test first fails, then passes**

Create `vitest.config.ts`:

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { '@': path.resolve(root, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
```

Run `pnpm test -- src/lib/utils.test.ts` before `src/lib/utils.ts` exists. Expected: FAIL because `@/lib/utils` cannot be resolved.

Ensure `src/lib/utils.ts` contains the shadcn helper:

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Run `pnpm test -- src/lib/utils.test.ts`. Expected: PASS with one test.

- [ ] **Step 6: Verify configuration and commit**

Run:

```bash
pnpm check
pnpm build
pnpm test
```

Expected: all commands exit zero and the build writes `dist/index.html`.

Commit:

```bash
git add .gitignore package.json pnpm-lock.yaml pnpm-workspace.yaml astro.config.mjs tsconfig.json components.json vitest.config.ts public src/test src/styles src/lib/utils.ts src/lib/utils.test.ts src/components/ui src/pages/index.astro src/layouts/Layout.astro src/components/Welcome.astro src/assets
git commit -m "build: configure React and shadcn foundation"
```

### Task 2: Add the validated demonstration metadata model

**Files:**
- Create: `src/data/metadata.json`
- Create: `src/lib/metadata.ts`
- Create: `src/lib/metadata.test.ts`

**Interfaces:**
- Consumes: Zod and TypeScript strict mode from Task 1.
- Produces: `MetadataField`, `MetadataGroup`, `MetadataBlock`, `validateMetadata(input: unknown): MetadataBlock[]`, `countFields(blocks: MetadataBlock[]): number`, and `getFieldPath(block, group, field): string`.

- [ ] **Step 1: Write validation and helper tests**

Create `src/lib/metadata.test.ts` with a local valid fixture and these assertions:

```ts
import { describe, expect, it } from 'vitest';

import { countFields, getFieldPath, validateMetadata } from '@/lib/metadata';

const valid = [
  {
    id: 'citation',
    name: 'Citation Metadata',
    description: 'Core information used to identify and cite a dataset.',
    groups: [
      {
        id: 'author',
        name: 'Author',
        fields: [
          {
            id: 'authorIdentifier',
            name: 'Identifier',
            summary: 'A persistent identifier for the author.',
            description: 'A globally unique identifier associated with the author.',
            type: 'Text',
            required: false,
            repeatable: true,
            example: 'https://orcid.org/0000-0002-1825-0097',
            aliases: ['ORCID'],
          },
        ],
      },
    ],
  },
];

describe('validateMetadata', () => {
  it('returns valid metadata', () => {
    expect(validateMetadata(valid)).toEqual(valid);
  });

  it.each([
    ['an empty dataset', []],
    ['an empty block id', [{ ...valid[0], id: '' }]],
    ['a block without groups', [{ ...valid[0], groups: [] }]],
    ['a field with the wrong required type', [{ ...valid[0], groups: [{ ...valid[0].groups[0], fields: [{ ...valid[0].groups[0].fields[0], required: 'no' }] }] }]],
  ])('rejects %s', (_label, input) => {
    expect(() => validateMetadata(input)).toThrow();
  });

  it('rejects duplicate identifiers across blocks', () => {
    const duplicateField = {
      ...valid[0],
      id: 'second',
      groups: [{ ...valid[0].groups[0], id: 'secondAuthor' }],
    };
    expect(() => validateMetadata([...valid, duplicateField])).toThrow(/duplicate field id: authorIdentifier/i);
  });
});

it('counts fields across groups and builds a hierarchy path', () => {
  const blocks = validateMetadata(valid);
  expect(countFields(blocks)).toBe(1);
  expect(getFieldPath(blocks[0], blocks[0].groups[0], blocks[0].groups[0].fields[0])).toBe(
    'Citation Metadata › Author › Identifier',
  );
});
```

- [ ] **Step 2: Run the metadata tests to verify failure**

Run `pnpm test -- src/lib/metadata.test.ts`.

Expected: FAIL because `@/lib/metadata` does not exist.

- [ ] **Step 3: Implement the schemas, validation, and helpers**

Create `src/lib/metadata.ts` around these exact public definitions:

```ts
import { z } from 'zod';

const nonempty = z.string().trim().min(1);

const metadataFieldSchema = z.object({
  id: nonempty,
  name: nonempty,
  summary: nonempty,
  description: nonempty,
  type: nonempty,
  required: z.boolean(),
  repeatable: z.boolean(),
  example: nonempty,
  aliases: z.array(nonempty),
});

const metadataGroupSchema = z.object({
  id: nonempty,
  name: nonempty,
  fields: z.array(metadataFieldSchema).min(1),
});

const metadataBlockSchema = z.object({
  id: nonempty,
  name: nonempty,
  description: nonempty,
  groups: z.array(metadataGroupSchema).min(1),
});

const metadataSchema = z.array(metadataBlockSchema).min(1).superRefine((blocks, context) => {
  const blockIds = new Set<string>();
  const groupIds = new Set<string>();
  const fieldIds = new Set<string>();
  const addId = (seen: Set<string>, kind: string, id: string, path: (string | number)[]) => {
    if (seen.has(id)) {
      context.addIssue({ code: 'custom', message: `Duplicate ${kind} id: ${id}`, path });
    }
    seen.add(id);
  };

  for (const [blockIndex, block] of blocks.entries()) {
    addId(blockIds, 'block', block.id, [blockIndex, 'id']);
    for (const [groupIndex, group] of block.groups.entries()) {
      addId(groupIds, 'group', group.id, [blockIndex, 'groups', groupIndex, 'id']);
      for (const [fieldIndex, field] of group.fields.entries()) {
        addId(fieldIds, 'field', field.id, [blockIndex, 'groups', groupIndex, 'fields', fieldIndex, 'id']);
      }
    }
  }
});

export type MetadataField = z.infer<typeof metadataFieldSchema>;
export type MetadataGroup = z.infer<typeof metadataGroupSchema>;
export type MetadataBlock = z.infer<typeof metadataBlockSchema>;

export function validateMetadata(input: unknown): MetadataBlock[] {
  return metadataSchema.parse(input);
}

export function countFields(blocks: MetadataBlock[]): number {
  return blocks.reduce(
    (total, block) => total + block.groups.reduce((groupTotal, group) => groupTotal + group.fields.length, 0),
    0,
  );
}

export function getFieldPath(block: MetadataBlock, group: MetadataGroup, field: MetadataField): string {
  return `${block.name} › ${group.name} › ${field.name}`;
}
```

- [ ] **Step 4: Add the exact demonstration inventory to JSON**

Create `src/data/metadata.json` with these four blocks and exact group/field inventory. Every field must include all properties from `MetadataField`.

Use block IDs `citation`, `geospatial`, `socialScience`, and `astronomy`. Use group IDs `author`, `otherIdentifier`, `geographicCoverage`, `studyDesign`, and `observation` in the same order as the table.

| Block | Group | Field ID | Name | Type | Required | Repeatable | Example | Aliases |
|---|---|---|---|---|---:|---:|---|---|
| Citation Metadata | Author | `authorName` | Name | Text | true | true | Ada Lovelace | creator, contributor |
| Citation Metadata | Author | `authorIdentifier` | Identifier | Text | false | true | https://orcid.org/0000-0002-1825-0097 | ORCID, researcher ID |
| Citation Metadata | Author | `authorIdentifierScheme` | Identifier Scheme | Controlled Vocabulary | false | true | ORCID | identifier type |
| Citation Metadata | Other Identifier | `otherId` | Other Identifier | Text | false | true | doi:10.1234/example | alternate identifier |
| Citation Metadata | Other Identifier | `otherIdAgency` | Other Identifier Agency | Text | false | true | DataCite | issuing agency |
| Geospatial Metadata | Geographic Coverage | `geographicCoverage` | Geographic Coverage | Text | false | true | Chesapeake Bay | location, place |
| Geospatial Metadata | Geographic Coverage | `westLongitude` | Westernmost Longitude | Number | false | false | -77.5 | west bound |
| Geospatial Metadata | Geographic Coverage | `eastLongitude` | Easternmost Longitude | Number | false | false | -75.2 | east bound |
| Social Science Metadata | Study Design | `unitOfAnalysis` | Unit of Analysis | Controlled Vocabulary | false | true | Individual | analysis unit |
| Social Science Metadata | Study Design | `universe` | Universe | Text | false | false | Adults living in the United States | population |
| Social Science Metadata | Study Design | `timeMethod` | Time Method | Controlled Vocabulary | false | true | Longitudinal | temporal design |
| Astronomy Metadata | Observation | `object` | Object | Text | false | true | M31 | celestial object, target |
| Astronomy Metadata | Observation | `telescope` | Telescope | Text | false | true | Hubble Space Telescope | observatory |
| Astronomy Metadata | Observation | `instrument` | Instrument | Text | false | true | Wide Field Camera 3 | detector |

Use these exact block descriptions:

```text
Citation Metadata: Core information used to identify, describe, and cite a dataset.
Geospatial Metadata: Spatial coverage and geographic boundaries associated with a dataset.
Social Science Metadata: Study design and population concepts used in social science research.
Astronomy Metadata: Observational targets and equipment used to collect astronomy data.
```

Use this exact explanatory copy:

| Field ID | Summary | Description |
|---|---|---|
| `authorName` | Person or organization responsible for creating the dataset. | The full name of a person or organization credited with creating the dataset. Enter names in the form preferred for citation. |
| `authorIdentifier` | Persistent identifier associated with the author. | A globally unique identifier for the named author, such as an ORCID iD. Use the corresponding scheme in Identifier Scheme. |
| `authorIdentifierScheme` | Scheme used for the author identifier. | The controlled vocabulary value that identifies which system issued or manages the author identifier. |
| `otherId` | Identifier assigned to the dataset by another system. | An identifier other than the repository's primary persistent identifier. Pair it with the organization recorded in Other Identifier Agency. |
| `otherIdAgency` | Organization that issued the other identifier. | The name of the agency, archive, or registration service responsible for assigning the related other identifier. |
| `geographicCoverage` | Place or region represented by the dataset. | A named geographic area covered by the data, ranging from a specific locality to a country or larger region. |
| `westLongitude` | Western edge of the dataset's bounding box. | The westernmost longitude in decimal degrees. West longitudes use negative values. |
| `eastLongitude` | Eastern edge of the dataset's bounding box. | The easternmost longitude in decimal degrees. West longitudes use negative values. |
| `unitOfAnalysis` | Basic entity examined by the study. | The type of entity about which observations are recorded, such as an individual, household, event, or organization. |
| `universe` | Population to which the study applies. | A description of the population, objects, or events that the study intends to represent. |
| `timeMethod` | Temporal structure used by the study. | The study's relationship to time, such as cross-sectional, longitudinal, or repeated cross-sectional. |
| `object` | Celestial object targeted by the observation. | The common name, catalog designation, or other identifier of the astronomical target. |
| `telescope` | Telescope used to collect the observation. | The telescope or observatory facility responsible for gathering the source measurements. |
| `instrument` | Instrument attached to the observing system. | The detector, camera, spectrograph, or other instrument used to record the observation. |

- [ ] **Step 5: Validate the JSON and pass all tests**

Add a test that imports the JSON and asserts:

```ts
import demoMetadata from '@/data/metadata.json';

it('validates the demonstration dataset', () => {
  const blocks = validateMetadata(demoMetadata);
  expect(blocks).toHaveLength(4);
  expect(countFields(blocks)).toBe(14);
});
```

Run:

```bash
pnpm test -- src/lib/metadata.test.ts
pnpm check
```

Expected: all metadata tests pass and Astro reports no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/metadata.json src/lib/metadata.ts src/lib/metadata.test.ts
git commit -m "feat: add validated demo metadata"
```

### Task 3: Implement context-preserving Fuse.js search

**Files:**
- Create: `src/lib/search.ts`
- Create: `src/lib/search.test.ts`

**Interfaces:**
- Consumes: `MetadataBlock`, `MetadataField`, and `countFields` from Task 2.
- Produces: `TextRange`, `FieldMatch`, `SearchBlock`, `SearchView`, and `createMetadataSearch(blocks: MetadataBlock[]): { search(query: string): SearchView }`.

- [ ] **Step 1: Write tests for empty, weighted, context-preserving, and no-result searches**

Create `src/lib/search.test.ts` by importing and validating `src/data/metadata.json`, then assert these exact behaviors:

```ts
const search = createMetadataSearch(blocks);

it('returns all blocks in source order for a whitespace-only query', () => {
  const view = search.search('   ');
  expect(view.isSearching).toBe(false);
  expect(view.matchingFieldCount).toBe(14);
  expect(view.blocks.map(({ block }) => block.id)).toEqual([
    'citation',
    'geospatial',
    'socialScience',
    'astronomy',
  ]);
});

it('removes unrelated blocks but retains every field in a matching block', () => {
  const view = search.search('ORCID');
  expect(view.isSearching).toBe(true);
  expect(view.matchingFieldCount).toBe(1);
  expect(view.blocks.map(({ block }) => block.id)).toEqual(['citation']);
  expect(view.blocks[0].block.groups.flatMap((group) => group.fields).map((field) => field.id)).toEqual([
    'authorName',
    'authorIdentifier',
    'authorIdentifierScheme',
    'otherId',
    'otherIdAgency',
  ]);
  expect([...view.blocks[0].matches.keys()]).toEqual(['authorIdentifier']);
});

it('searches identifiers, aliases, summaries, descriptions, and examples', () => {
  expect(search.search('authorIdentifier').matchingFieldCount).toBe(1);
  expect(search.search('researcher ID').matchingFieldCount).toBe(1);
  expect(search.search('persistent author').matchingFieldCount).toBe(1);
  expect(search.search('globally unique').matchingFieldCount).toBe(1);
  expect(search.search('0000-0002-1825-0097').matchingFieldCount).toBe(1);
});

it('ranks a direct field-name match ahead of a description-only match', () => {
  expect(search.search('identifier').blocks[0].block.id).toBe('citation');
});

it('returns an empty block list for no matches', () => {
  expect(search.search('zzzz-no-field').blocks).toEqual([]);
});
```

Also assert that a name match includes normalized inclusive ranges for the `name` key and that equal scores retain source order.

- [ ] **Step 2: Run the search tests to verify failure**

Run `pnpm test -- src/lib/search.test.ts`.

Expected: FAIL because `@/lib/search` does not exist.

- [ ] **Step 3: Implement the search interface and flattening boundary**

Create these public types in `src/lib/search.ts`:

```ts
import Fuse, { type FuseResultMatch } from 'fuse.js';

import { countFields, type MetadataBlock, type MetadataField } from '@/lib/metadata';

export type TextRange = readonly [start: number, end: number];

export interface FieldMatch {
  fieldId: string;
  score: number;
  ranges: Partial<Record<'id' | 'name' | 'summary' | 'description' | 'example', TextRange[]>>;
}

export interface SearchBlock {
  block: MetadataBlock;
  matches: Map<string, FieldMatch>;
  bestScore: number;
  sourceIndex: number;
}

export interface SearchView {
  isSearching: boolean;
  normalizedQuery: string;
  matchingFieldCount: number;
  blocks: SearchBlock[];
}
```

Flatten fields into private records containing `blockIndex`, `field`, and the searchable field properties. Build one Fuse instance in `createMetadataSearch`, not inside each `search` call.

- [ ] **Step 4: Implement exact Fuse options and result grouping**

Use these Fuse options:

```ts
const fuse = new Fuse(records, {
  includeMatches: true,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
  threshold: 0.32,
  keys: [
    { name: 'name', weight: 0.35 },
    { name: 'id', weight: 0.2 },
    { name: 'aliases', weight: 0.15 },
    { name: 'summary', weight: 0.13 },
    { name: 'description', weight: 0.12 },
    { name: 'example', weight: 0.05 },
  ],
});
```

For an empty normalized query, return all source blocks with `isSearching: false`, an empty `matches` Map, `bestScore: 0`, and `matchingFieldCount: countFields(blocks)`. For a nonempty query, group Fuse results by block, store one `FieldMatch` per matching field, omit blocks with no results, and sort by `bestScore` then `sourceIndex`.

Convert Fuse match indices into sorted, merged inclusive `TextRange` arrays. Ignore `aliases` ranges because aliases are shown as complete badges in the dialog; still mark the field as matched. Treat a missing score as `1`.

- [ ] **Step 5: Run focused and full tests, then commit**

Run:

```bash
pnpm test -- src/lib/search.test.ts
pnpm test
pnpm check
```

Expected: all commands pass.

Commit:

```bash
git add src/lib/search.ts src/lib/search.test.ts
git commit -m "feat: add context-preserving metadata search"
```

### Task 4: Build match highlighting and presentational dictionary sections

**Files:**
- Create: `src/components/dictionary/HighlightText.tsx`
- Create: `src/components/dictionary/HighlightText.test.tsx`
- Create: `src/components/dictionary/FieldCard.tsx`
- Create: `src/components/dictionary/MetadataBlockSection.tsx`
- Create: `src/components/dictionary/MetadataBlockSection.test.tsx`

**Interfaces:**
- Consumes: `MetadataBlock`, `MetadataField`, `SearchBlock`, `FieldMatch`, `TextRange`, and Task 1 shadcn primitives.
- Produces: `HighlightText({ text, ranges })`, `FieldCard({ field, match, onSelect })`, and `MetadataBlockSection({ result, onSelectField })`.

- [ ] **Step 1: Write safe highlight rendering tests**

Create `HighlightText.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HighlightText } from '@/components/dictionary/HighlightText';

describe('HighlightText', () => {
  it('renders merged ranges with mark elements and preserves all text', () => {
    const { container } = render(<HighlightText text="Author Identifier" ranges={[[0, 5], [7, 16]]} />);
    expect(container).toHaveTextContent('Author Identifier');
    expect(screen.getAllByText(/Author|Identifier/).every((node) => node.tagName === 'MARK')).toBe(true);
  });

  it('renders source text rather than interpreting markup', () => {
    const { container } = render(<HighlightText text={'<img src=x onerror=alert(1)>'} ranges={[[1, 3]]} />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('<img src=x onerror=alert(1)>');
  });
});
```

- [ ] **Step 2: Run the highlight tests to verify failure, then implement minimal segmentation**

Run `pnpm test -- src/components/dictionary/HighlightText.test.tsx`.

Expected: FAIL because the component does not exist.

Implement `HighlightText` by slicing the source string into React text nodes and `<mark>` nodes. Clamp ranges to the string, ignore reversed/out-of-bounds ranges, merge overlapping ranges, and never use `dangerouslySetInnerHTML`.

Run the same command. Expected: PASS.

- [ ] **Step 3: Write field-card and block-section tests**

Test a `SearchBlock` containing the Author group with three sibling fields, where only `authorIdentifier` appears in `matches`. Assert:

```tsx
expect(screen.getByRole('heading', { name: 'Citation Metadata' })).toBeInTheDocument();
expect(screen.getByRole('heading', { name: 'Author' })).toBeInTheDocument();
expect(screen.getByText('Name')).toBeInTheDocument();
expect(screen.getByText('Identifier')).toBeInTheDocument();
expect(screen.getByText('Identifier Scheme')).toBeInTheDocument();
expect(screen.getByText('Search match')).toBeInTheDocument();
expect(screen.getAllByRole('button', { name: /view details for/i })).toHaveLength(3);
```

Click `View details for Identifier` and assert `onSelectField` receives the block, group, and field objects. Assert required and repeatable badges appear only when their booleans are true and every type badge appears.

- [ ] **Step 4: Implement the presentational components**

Use these exact callback interfaces:

```tsx
interface FieldCardProps {
  field: MetadataField;
  match?: FieldMatch;
  onSelect(): void;
}

interface MetadataBlockSectionProps {
  result: SearchBlock;
  onSelectField(block: MetadataBlock, group: MetadataGroup, field: MetadataField): void;
}
```

`MetadataBlockSection` renders a semantic `<section>` with an `h2`, description, field count, Separator, group `h3` headings, and a responsive card grid. It iterates the original `result.block.groups` and fields so matching blocks retain all context. Each card receives `onSelect={() => onSelectField(result.block, group, field)}`.

`FieldCard` renders Card, CardHeader, CardTitle, CardDescription, CardContent, and CardFooter. Use `match !== undefined` to add a stronger border/background plus a visible `Search match` label with a search icon. Use `HighlightText` for field name and summary ranges. Render type, Required, and Repeatable badges. The details control is a Button with `aria-label={`View details for ${field.name}`}`.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm test -- src/components/dictionary/HighlightText.test.tsx src/components/dictionary/MetadataBlockSection.test.tsx
pnpm check
```

Expected: tests and type checking pass.

Commit:

```bash
git add src/components/dictionary/HighlightText.tsx src/components/dictionary/HighlightText.test.tsx src/components/dictionary/FieldCard.tsx src/components/dictionary/MetadataBlockSection.tsx src/components/dictionary/MetadataBlockSection.test.tsx
git commit -m "feat: render contextual metadata cards"
```

### Task 5: Add the accessible field-details dialog

**Files:**
- Create: `src/components/dictionary/FieldDetailsDialog.tsx`
- Create: `src/components/dictionary/FieldDetailsDialog.test.tsx`

**Interfaces:**
- Consumes: `MetadataBlock`, `MetadataGroup`, `MetadataField`, `getFieldPath`, and shadcn Dialog/Badge/Button/Separator.
- Produces: `SelectedField = { block: MetadataBlock; group: MetadataGroup; field: MetadataField }` and `FieldDetailsDialog({ selected, onOpenChange })`.

- [ ] **Step 1: Write dialog content and dismissal tests**

Render the dialog with the Author Identifier selection and assert it exposes a dialog named `Identifier`, contains the complete description, `authorIdentifier`, `Text`, `No` for required, `Yes` for repeatable, the ORCID example, the `ORCID` alias, and `Citation Metadata › Author › Identifier`.

Use `userEvent.keyboard('{Escape}')` and assert `onOpenChange(false)` is called. Render with `selected={null}` and assert no dialog is present.

- [ ] **Step 2: Run the dialog test to verify failure**

Run `pnpm test -- src/components/dictionary/FieldDetailsDialog.test.tsx`.

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the controlled dialog**

Use this public shape:

```tsx
export interface SelectedField {
  block: MetadataBlock;
  group: MetadataGroup;
  field: MetadataField;
}

interface FieldDetailsDialogProps {
  selected: SelectedField | null;
  onOpenChange(open: boolean): void;
}
```

Render `Dialog open={selected !== null} onOpenChange={onOpenChange}`. The content uses a maximum height based on `100dvh` with vertical overflow, DialogTitle for the field name, DialogDescription for the complete description, a semantic description list for identifier/type/required/repeatable, a code-styled example, alias badges only when aliases exist, the full hierarchy path, and an explicit Button nested under `DialogClose asChild`.

- [ ] **Step 4: Run tests and commit**

Run:

```bash
pnpm test -- src/components/dictionary/FieldDetailsDialog.test.tsx
pnpm test
pnpm check
```

Expected: all commands pass.

Commit:

```bash
git add src/components/dictionary/FieldDetailsDialog.tsx src/components/dictionary/FieldDetailsDialog.test.tsx
git commit -m "feat: add metadata field details dialog"
```

### Task 6: Wire the interactive metadata dictionary island

**Files:**
- Create: `src/components/dictionary/MetadataDictionary.tsx`
- Create: `src/components/dictionary/MetadataDictionary.test.tsx`

**Interfaces:**
- Consumes: `MetadataBlock[]`, `createMetadataSearch`, `MetadataBlockSection`, `SelectedField`, `FieldDetailsDialog`, and shadcn Input/Button.
- Produces: default-exported `MetadataDictionary({ blocks }: { blocks: MetadataBlock[] })` for Astro hydration.

- [ ] **Step 1: Write the full interaction tests**

Use a two-block fixture and Testing Library/user-event to assert:

```tsx
render(<MetadataDictionary blocks={blocks} />);

expect(screen.getByLabelText('Search metadata fields')).toBeInTheDocument();
expect(screen.getByText('5 fields · 2 metadata blocks')).toBeInTheDocument();
expect(screen.getByRole('heading', { name: 'Citation Metadata' })).toBeInTheDocument();
expect(screen.getByRole('heading', { name: 'Geospatial Metadata' })).toBeInTheDocument();
```

After typing `ORCID`, assert the summary reads `1 matching field · 1 metadata block`, Citation remains, Geospatial disappears, all Citation sibling cards remain, and the Identifier card contains `Search match`.

After clearing the input, assert both blocks return in source order. After typing `zzzz-no-field`, assert a status message includes `No metadata fields matched “zzzz-no-field”`, a `Clear search` button is present, and clicking it restores the full dictionary and focuses the search input.

Click a details button, assert the dialog opens with the correct hierarchy, close it with Escape, and assert focus returns to the originating details button.

- [ ] **Step 2: Run the interaction tests to verify failure**

Run `pnpm test -- src/components/dictionary/MetadataDictionary.test.tsx`.

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the state and derived search view**

Implement only these mutable values:

```tsx
const [query, setQuery] = useState('');
const [selected, setSelected] = useState<SelectedField | null>(null);
const metadataSearch = useMemo(() => createMetadataSearch(blocks), [blocks]);
const view = useMemo(() => metadataSearch.search(query), [metadataSearch, query]);
```

Render a visible `<label htmlFor="metadata-search">Search metadata fields</label>`, a search icon adjacent to the Input, and placeholder `Search names, descriptions, identifiers, and examples…`. Do not debounce 14 local records.

Use a polite live region for summaries. Use singular/plural grammar for `field(s)` and `metadata block(s)`. For a nonsearch view, display total fields; for search, display `matchingFieldCount`.

- [ ] **Step 4: Implement results, no-results clearing, and dialog selection**

Map `view.blocks` to `MetadataBlockSection`. When selecting a card, store `{ block, group, field }`. Render the controlled `FieldDetailsDialog` once at island level.

When `view.isSearching && view.blocks.length === 0`, replace the block list with a bordered no-results region containing the exact normalized query and a clear-search Button. Hold a ref to the search Input; clearing sets the query to `''` and restores input focus.

- [ ] **Step 5: Run all behavior tests and commit**

Run:

```bash
pnpm test -- src/components/dictionary/MetadataDictionary.test.tsx
pnpm test
pnpm check
```

Expected: all commands pass.

Commit:

```bash
git add src/components/dictionary/MetadataDictionary.tsx src/components/dictionary/MetadataDictionary.test.tsx
git commit -m "feat: add interactive metadata dictionary"
```

### Task 7: Replace the starter page with the finished application shell

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`
- Delete: `src/components/Welcome.astro`
- Delete: `src/assets/astro.svg`
- Delete: `src/assets/background.svg`
- Modify: `README.md`

**Interfaces:**
- Consumes: validated `src/data/metadata.json` and `MetadataDictionary` from earlier tasks.
- Produces: the complete static page and project-specific development documentation.

- [ ] **Step 1: Integrate validated data and the React island on the Astro page**

Replace `src/pages/index.astro` with the equivalent of:

```astro
---
import MetadataDictionary from '@/components/dictionary/MetadataDictionary';
import metadataJson from '@/data/metadata.json';
import Layout from '@/layouts/Layout.astro';
import { validateMetadata } from '@/lib/metadata';

const metadata = validateMetadata(metadataJson);
---

<Layout title="Metadata Lookup" description="Search and browse demonstration Dataverse metadata fields.">
  <main class="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <header class="mb-10 max-w-3xl">
      <p class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Dataverse field guide</p>
      <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Metadata Lookup</h1>
      <p class="mt-4 text-lg leading-8 text-muted-foreground">
        Search and explore a demonstration metadata dictionary while keeping every field in context.
      </p>
    </header>
    <MetadataDictionary blocks={metadata} client:load />
  </main>
</Layout>
```

- [ ] **Step 2: Implement the semantic layout and base-path-safe metadata**

Update `Layout.astro` to accept `title` and `description`, import `@/styles/global.css`, set `lang="en"`, render charset and viewport metadata, use the passed title/description, and resolve favicon references with `import.meta.env.BASE_URL` rather than root-absolute `/favicon.svg`.

- [ ] **Step 3: Finish the light visual system and responsive layout**

Retain shadcn's generated CSS variables and add:

```css
@import "tailwindcss";

@layer base {
  * {
    @apply border-border;
  }

  html {
    color-scheme: light;
    scroll-behavior: smooth;
  }

  body {
    @apply min-h-screen bg-background text-foreground antialiased;
    background-image:
      radial-gradient(circle at top left, color-mix(in oklab, var(--primary) 8%, transparent), transparent 28rem),
      linear-gradient(to bottom, color-mix(in oklab, var(--muted) 35%, transparent), transparent 18rem);
  }

  button,
  input {
    font: inherit;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Apply component classes so field cards render in one column below `md`, two columns at `md`, badges wrap, details buttons are at least 44 CSS pixels high on touch layouts, match cards have both visible `Search match` text and accent styling, and dialogs use `max-h-[calc(100dvh-2rem)] overflow-y-auto`.

- [ ] **Step 4: Replace starter documentation and assets**

Delete the unused Welcome component and Astro starter SVG assets. Replace README content with the product purpose, demonstration-data notice, prerequisites (`Node >=22.12.0`, pnpm), and commands:

```bash
pnpm install
pnpm astro dev --background
pnpm astro dev status
pnpm astro dev logs
pnpm astro dev stop
pnpm test
pnpm check
pnpm build
```

Document that deployment uses GitHub Pages and that real metadata can later replace `src/data/metadata.json` if it satisfies the validated shape.

- [ ] **Step 5: Run integration verification and commit**

Run:

```bash
pnpm test
pnpm check
pnpm build
```

Expected: all commands exit zero, `dist/index.html` exists, and built asset URLs include `/dv-fields-lookup/` where needed.

Commit:

```bash
git add src/layouts/Layout.astro src/pages/index.astro src/styles/global.css README.md src/components/Welcome.astro src/assets/astro.svg src/assets/background.svg
git commit -m "feat: integrate metadata lookup page"
```

### Task 8: Add GitHub Pages deployment and perform final verification

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: the successful static build from Task 7.
- Produces: an official Astro GitHub Pages workflow and recorded deployment setup instructions.

- [ ] **Step 1: Add the official two-job Pages workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v7
      - name: Install, build, and upload site
        uses: withastro/action@v6
        with:
          package-manager: pnpm@11.24.0

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Document the one required repository setting**

Add to README: in GitHub repository Settings → Pages, choose GitHub Actions as the source. State that pushes to `main` and manual workflow dispatches deploy the static site.

- [ ] **Step 3: Run automated final verification from a clean dependency graph**

Run:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
```

Expected: installation does not alter `pnpm-lock.yaml`; all tests pass; Astro check reports no errors; build exits zero.

- [ ] **Step 4: Run the background preview and perform the manual acceptance pass**

Run:

```bash
pnpm astro dev --background
pnpm astro dev status
```

Open the reported local URL manually and verify:

- The initial page shows 14 fields and four metadata blocks.
- Search is prominently visible and has a visible label.
- `ORCID` leaves Citation visible, removes the other blocks, retains all five Citation fields, and identifies Identifier as a search match.
- `coverage` ranks Geospatial first when it is among multiple fuzzy matches.
- `zzzz-no-field` renders no results and Clear search restores all blocks and input focus.
- Details opens for a field, shows every defined attribute, closes with Escape, and returns focus to its trigger.
- Keyboard focus indicators remain visible through the complete flow.
- At 375 CSS pixels wide, cards use one column, badges wrap, and dialog content scrolls without horizontal overflow.
- At desktop width, content stays within the maximum width and cards use two columns.
- Reduced-motion mode does not rely on animation for meaning.

Inspect `pnpm astro dev logs` for runtime warnings, then stop the server with `pnpm astro dev stop`.

- [ ] **Step 5: Inspect the built GitHub Pages paths**

Run:

```bash
rg -n 'src="/|href="/' dist/index.html
```

Expected: no application asset or internal navigation URL incorrectly points to the domain root; generated assets use `/dv-fields-lookup/`.

- [ ] **Step 6: Commit deployment and documentation**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: deploy metadata lookup to GitHub Pages"
```

- [ ] **Step 7: Record the final repository state**

Run:

```bash
git status --short
git log --oneline --decorate -9
```

Expected: no implementation files are uncommitted. Pre-existing untracked user files, if any, remain untouched unless this plan explicitly incorporated them.
