import { defaultLang, ui } from '@/i18n/ui';

export type Lang = keyof typeof ui;
export type UIKey = keyof (typeof ui)[typeof defaultLang];

const langs = Object.keys(ui) as Lang[];

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && langs.includes(value as Lang);
}

/** Narrows an arbitrary locale string (e.g. Astro.currentLocale) to a supported one. */
export function toLang(value: unknown): Lang {
  return isLang(value) ? value : defaultLang;
}

/** Returns `t(key, params?)` for `lang`, falling back to English for any untranslated key. */
export function useTranslations(lang: Lang) {
  const dictionary: Partial<Record<UIKey, string>> = ui[lang] ?? {};
  return function t(key: UIKey, params?: Record<string, string | number>): string {
    const template = dictionary[key] ?? ui[defaultLang][key];
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  };
}

export type Translate = ReturnType<typeof useTranslations>;

/**
 * Picks the singular or plural word for `count`.
 * ponytail: one/other only — enough for English and Chinese. Swap in Intl.PluralRules if a
 * locale with more plural categories (e.g. Polish, Arabic) is ever added.
 */
export function plural(t: Translate, count: number, one: UIKey, other: UIKey): string {
  return t(count === 1 ? one : other);
}

/**
 * Display label for a `recommendation` token from metadata.overrides.yaml. Those tokens stay
 * canonical English in every locale (filters and badge colours match on them), so they are
 * translated here at render time. An unrecognised token renders as-is rather than as a key.
 */
export function tierLabel(t: Translate, token: string): string {
  const key = `tier.${token}`;
  return key in ui[defaultLang] ? t(key as UIKey) : token;
}
