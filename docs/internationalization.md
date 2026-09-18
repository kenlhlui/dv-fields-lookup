# Internationalization

The site ships English (`en`, served at `/`) and Traditional Chinese — Hong Kong (`zh-hk`, served at `/zh-hk/`). Both are built statically; a language switcher in the header links between them. Locale ids are lowercase so the config id, the URL segment and the `<html lang>` value are all one string.

## What is and isn't translated

| | Translated | Where |
| --- | --- | --- |
| Interface text (labels, buttons, dialogs) | Yes | `src/i18n/locales/<locale>.json` |
| Site title, description, footer | Yes | `src/i18n/locales/<locale>.json` under the `site.*` keys |
| Block, facet and best-practice descriptions | Yes | `src/data/<locale>/*.yaml` |
| Acknowledgements dialog | Yes | `src/content/information.<locale>.md` |
| Field names, definitions, controlled vocabulary | **No** | `src/data/metadata.json`, straight from the Dataverse API |
| `recommendation` values (`Required`/`Recommended`/`Optional`) | **No** | Canonical tokens — see below |
| Installation name and URLs | **No** | [`src/site.config.ts`](../src/site.config.ts) |

Anything a locale doesn't translate falls back to English **per key**, so a partial translation is a valid, shippable state — a new locale renders correctly from its first commit and fills in over time.

`recommendation` values are load-bearing: the filter buttons and badge colours match on those exact English strings. Keep them English in every locale; their visible labels come from the `tier.*` keys in `src/i18n/locales/<locale>.json`. See [`src/data/README.md`](../src/data/README.md) for the full rule.

## Translating the interface

Interface text lives in one flat JSON file per locale in [`src/i18n/locales/`](../src/i18n/locales/), with [`en.json`](../src/i18n/locales/en.json) as the source. Translate the value on the right of each line and leave the key on the left alone. Words in braces like `{count}` are filled in by the app, so keep them as they are, but move them wherever your language's word order needs them. An empty or missing value shows the English text instead.

- `count.*.one` / `count.*.other` are the singular and plural forms. A language without plural inflection, such as Chinese, uses the same word for both.
- `tier.*` keys are named after the English `recommendation` tokens. Translate the value, never the key.

## Adding a locale

Using `fr` as an example:

1. Add it to `i18n.locales` in [`astro.config.mjs`](../astro.config.mjs):

    ```js
    i18n: {
      locales: ['en', 'zh-hk', 'fr'],
      defaultLocale: 'en',
      routing: { prefixDefaultLocale: false },
    },
    ```

2. Copy [`src/i18n/locales/en.json`](../src/i18n/locales/en.json) to `src/i18n/locales/fr.json` and translate it, or keep only the keys you have — the rest falls back to English. Then register it in [`src/i18n/ui.ts`](../src/i18n/ui.ts), which takes three edits: an import, a switcher label in `languages` (written in the language itself), and an entry in `ui`.

    ```ts
    import en from '@/i18n/locales/en.json';
    import zhHk from '@/i18n/locales/zh-hk.json';
    import fr from '@/i18n/locales/fr.json';

    export const languages = {
      en: 'English',
      'zh-hk': '繁體中文',
      fr: 'Français',
    } as const;

    export const ui = {
      en,
      'zh-hk': zhHk,
      fr,
    };
    ```

3. Create `src/data/fr/` with any of `metadata.overrides.yaml`, `block-descriptions.yaml` and `facet-descriptions.yaml`. Each file needs only the keys you translate; omit `recommendation` entirely.

4. Create `src/content/information.fr.md` — this is the Acknowledgements dialog, plain Markdown. Then register it in [`src/components/HomePage.astro`](../src/components/HomePage.astro), which takes two edits: an import alongside the existing ones, and an entry in the `informationPages` map.

    ```astro
    import * as informationEn from '@/content/information.en.md';
    import * as informationZhHk from '@/content/information.zh-hk.md';
    import * as informationFr from '@/content/information.fr.md';

    // …

    const informationPages = { en: informationEn, 'zh-hk': informationZhHk, fr: informationFr };
    ```

    The imports are static on purpose: Astro compiles Markdown to HTML at build time, and a dynamic `import()` built from the locale name would opt out of that and leave the file unprocessed. Miss this step and `pnpm check` fails with `ts(7053)` on `HomePage.astro` — the new locale can't index `informationPages` — so it can't ship silently broken.

5. Create `src/pages/fr/index.astro`:

    ```astro
    ---
    import HomePage from '@/components/HomePage.astro';
    ---

    <HomePage lang="fr" />
    ```

Then `pnpm check && pnpm test && pnpm build`. Steps 1, 2 and 5 must stay in sync: `src/i18n/utils.test.ts` asserts that every file in `src/i18n/locales/` is registered in `ui`, that every locale in `ui` has a switcher label, and that no locale file has a key missing from `en.json` (a mistyped key would otherwise be silently ignored). The build emits one page per `src/pages/<locale>/index.astro` — a locale with a dictionary but no page file gets a switcher link that 404s.
