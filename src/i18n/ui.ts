// Every user-facing string in the app, keyed by locale. Field names, definitions and
// controlled vocabulary come from src/data/metadata.json instead and are never translated;
// the curated best-practice layer lives in src/data/<locale>/*.yaml.
//
// Any key a locale leaves out falls back to English, so a partial translation is shippable.
// Adding a locale takes five steps across this file, astro.config.mjs, src/data/,
// src/content/ and src/pages/ — see the Internationalization section of the root README.

export const defaultLang = 'en';

// Native-language labels for the language switcher. Kept short — they sit in the page header.
export const languages = {
  en: 'English',
  'zh-hk': '繁體中文',
} as const;

export const ui = {
  en: {
    'site.title': 'Dataverse Metadata Field Lookup',
    'site.description':
      'Search and explore metadata fields in Borealis, with specifications and best practices in context.',
    'site.footerText': 'Made with ❤️ for the Dataverse community.',

    'lang.label': 'Language',

    'search.label': 'Search metadata fields',
    'search.placeholder': 'Search names, descriptions, identifiers, and examples…',
    'search.clearAll': 'Clear all',
    'search.clearSearch': 'Clear search',
    'search.clearFilters': 'Clear filters',
    'search.noResultsLabel': 'No search results',
    'search.emptyQuery': 'No metadata fields matched “{query}”',
    'search.emptyFilters': 'No metadata fields match the selected filters',
    'search.emptyQueryHint': 'Try a different search term or clear the current search.',
    'search.emptyFiltersHint': 'Try different filters or clear them.',

    'summary.browsing': '{fields} {fieldWord} · {blocks} {blockWord}',
    'summary.searching': '{fields} matching {fieldWord} · {blocks} {blockWord}',

    'facet.metadataBlock': 'Metadata block',
    'facet.required': 'Required',
    'facet.bestPractice': 'Best practice',
    'facet.filterByBlock': 'Filter by metadata block',
    'facet.filterByRequired': 'Filter by required',
    'facet.filterByBestPractice': 'Filter by best practice',

    // Keyed by the canonical English token stored in src/data/<locale>/metadata.overrides.yaml.
    // Those tokens are never translated in the data — see src/data/README.md.
    'tier.Required': 'Required',
    'tier.Recommended': 'Recommended',
    'tier.Optional': 'Optional',

    'count.field.one': 'field',
    'count.field.other': 'fields',
    'count.block.one': 'metadata block',
    'count.block.other': 'metadata blocks',
    'count.subfield.one': 'sub-field',
    'count.subfield.other': 'sub-fields',

    'nav.blocks': 'Metadata blocks',
    'block.fieldCount': '{count} {word}',
    'block.compound': 'Compound field · {count} {word}',

    'card.required': 'Required',
    'card.searchMatch': 'Search match',
    'card.repeatable': 'Repeatable',
    'card.bestPracticePrefix': 'Best practice: ',
    'card.bestPracticeBadge': 'Best practice: {tier}',
    'card.viewDetails': 'View details',
    'card.viewDetailsFor': 'View details for {name}',

    'details.identifier': 'Identifier',
    'details.type': 'Type',
    'details.required': 'Required',
    'details.repeatable': 'Repeatable',
    'details.bestPractice': 'Best practice',
    'details.yes': 'Yes',
    'details.no': 'No',
    'details.bestPracticeDefinition': 'Best practice definition',
    'details.example': 'Example',
    'details.allowedValues': 'Allowed values',
    'details.path': 'Path',
    'details.close': 'Close',

    'info.trigger': 'Information',
    'info.title': 'Information',
    'info.close': 'Close',

    'theme.toLight': 'Switch to light theme',
    'theme.toDark': 'Switch to dark theme',

    'a11y.backToTop': 'Back to top',
  },

  'zh-hk': {
    'site.title': 'Dataverse 元數據欄位查詢',
    'site.description': '搜尋及瀏覽 Borealis 的元數據欄位，附有規格說明及最佳實踐指引。',
    'site.footerText': '為 Dataverse 社群用心製作 ❤️',

    'lang.label': '語言',

    'search.label': '搜尋元數據欄位',
    'search.placeholder': '搜尋名稱、說明、識別碼及範例…',
    'search.clearAll': '全部清除',
    'search.clearSearch': '清除搜尋',
    'search.clearFilters': '清除篩選',
    'search.noResultsLabel': '沒有搜尋結果',
    'search.emptyQuery': '沒有元數據欄位符合「{query}」',
    'search.emptyFilters': '沒有元數據欄位符合所選的篩選條件',
    'search.emptyQueryHint': '請嘗試其他搜尋字詞，或清除目前的搜尋。',
    'search.emptyFiltersHint': '請嘗試其他篩選條件，或將其清除。',

    'summary.browsing': '{fields} 個{fieldWord} · {blocks} 個{blockWord}',
    'summary.searching': '{fields} 個相符{fieldWord} · {blocks} 個{blockWord}',

    'facet.metadataBlock': '元數據區塊',
    'facet.required': '必填',
    'facet.bestPractice': '最佳實踐',
    'facet.filterByBlock': '按元數據區塊篩選',
    'facet.filterByRequired': '按必填篩選',
    'facet.filterByBestPractice': '按最佳實踐篩選',

    'tier.Required': '必填',
    'tier.Recommended': '建議',
    'tier.Optional': '選填',

    // Chinese has no plural inflection; both forms are identical by design.
    'count.field.one': '欄位',
    'count.field.other': '欄位',
    'count.block.one': '元數據區塊',
    'count.block.other': '元數據區塊',
    'count.subfield.one': '子欄位',
    'count.subfield.other': '子欄位',

    'nav.blocks': '元數據區塊',
    'block.fieldCount': '{count} 個{word}',
    'block.compound': '複合欄位 · {count} 個{word}',

    'card.required': '必填',
    'card.searchMatch': '搜尋相符',
    'card.repeatable': '可重複',
    'card.bestPracticePrefix': '最佳實踐：',
    'card.bestPracticeBadge': '最佳實踐：{tier}',
    'card.viewDetails': '檢視詳情',
    'card.viewDetailsFor': '檢視「{name}」的詳情',

    'details.identifier': '識別碼',
    'details.type': '類型',
    'details.required': '必填',
    'details.repeatable': '可重複',
    'details.bestPractice': '最佳實踐',
    'details.yes': '是',
    'details.no': '否',
    'details.bestPracticeDefinition': '最佳實踐定義',
    'details.example': '範例',
    'details.allowedValues': '允許值',
    'details.path': '路徑',
    'details.close': '關閉',

    'info.trigger': '資訊',
    'info.title': '資訊',
    'info.close': '關閉',

    'theme.toLight': '切換至淺色主題',
    'theme.toDark': '切換至深色主題',

    'a11y.backToTop': '返回頂部',
  },
} as const;
