# URL parameters

The search text and every filter are kept in the page URL, so a filtered view can be bookmarked or shared. Opening the link restores the same search and filters, and the URL updates as you type or click a filter.

## Parameters

| Parameter | Value | Repeatable | Example |
| --- | --- | --- | --- |
| `q` | Search text | No | `q=author` |
| `block` | A metadata block's `name` from `src/data/metadata.json`, e.g. `citation`, `geospatial` | Yes | `block=citation&block=geospatial` |
| `required` | `true` to show required fields only | No | `required=true` |
| `bestPractice` | A best practice tier: `Recommended` or `Optional` | Yes | `bestPractice=Recommended` |

Repeat `block` or `bestPractice` to select several values, the same as clicking several filter buttons. A missing parameter means that filter is off, and a page with no filters has no query string at all.

## Examples

Fields matching "author" in the Citation block that are required:

```
https://{DOMAIN}/dv-fields-lookup/?q=author&block=citation&required=true
```

Recommended fields in the Geospatial block, on the Chinese page:

```
https://{DOMAIN}/dv-fields-lookup/zh-hk/?block=geospatial&bestPractice=Recommended
```

## Rules

- **Values are case-sensitive.** `block` must match the block's `name` exactly, `required` must be the lowercase `true`, and `bestPractice` uses the English tier tokens on every locale. See [Internationalization](internationalization.md#what-is-and-isnt-translated).
- **Unknown values are ignored**, so an outdated or mistyped link still opens and shows everything that was valid. A `block` that isn't in this installation's data is dropped, as is a misspelled tier or a `required` value other than `true`. Unrecognised parameters are ignored too.
- **Spaces and symbols in `q` are escaped.** A search for `soil & water` is written as `q=soil+%26+water`.
- **The URL is updated in place.** Typing or clicking a filter doesn't add entries to the browser's Back history.
- **Switching language keeps the search and filters.** The parameters are the same on every locale, so the switcher copies the query string onto its links each time its menu opens. Without JavaScript, the links still work but open the other locale unfiltered.

## Implementation

- [`src/lib/urlFilters.ts`](../src/lib/urlFilters.ts) converts between the query string and the filters: `parseFiltersFromUrl` reads them and drops unknown values, and `serializeFilters` writes them. Tests are in [`src/lib/urlFilters.test.ts`](../src/lib/urlFilters.test.ts).
- [`src/components/dictionary/MetadataDictionary.tsx`](../src/components/dictionary/MetadataDictionary.tsx) reads the URL once on load and writes it back whenever a filter changes, using `history.replaceState`. The read runs in an effect after hydration, not during the first render, because the page is pre-rendered without a URL. It must stay before the write effect, which would otherwise clear the URL before it's read.
- [`src/components/LanguageSwitcher.astro`](../src/components/LanguageSwitcher.astro) keeps its links as plain anchors and only rewrites their query string in its inline script, so it doesn't need to know the parameter names.
- Adding a filter means adding a field to `UrlQuery`, handling it in both functions, and wiring it into both effects. The round-trip test in `urlFilters.test.ts` fails if the two functions disagree.
