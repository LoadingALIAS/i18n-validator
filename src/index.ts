import languages from "./data/languages.json";
import countries from "./data/countries.json";
import type { Locale } from "./types";

export const i18nValidator = {
  parseLocale(input: string): Locale | null {
    const normalized = input.trim().toLowerCase();
    const bcpMatch = normalized.match(/^([a-z]{2,3})-([a-z]{2})$/);
    if (bcpMatch) {
      const [_, lang, region] = bcpMatch;
      if (
        languages[lang as keyof typeof languages] &&
        countries[region.toUpperCase() as keyof typeof countries]
      ) {
        return { language: lang, region };
      }
    }
    for (const [code, lang] of Object.entries(languages)) {
      if (
        code === normalized ||
        lang.iso6392 === normalized ||
        lang.iso6393 === normalized ||
        lang.name.toLowerCase() === normalized
      ) {
        return { language: code };
      }
    }
    return null;
  },

  toBcp47(locale: Locale): string {
    return locale.region
      ? `${locale.language}-${locale.region}`
      : locale.language;
  },

  getRegions(language: string): string[] {
    return languages[language]?.regions || [];
  },

  isValidLocale(locale: Locale): boolean {
    return (
      !!languages[locale.language] &&
      (!locale.region || !!countries[locale.region])
    );
  },
};
