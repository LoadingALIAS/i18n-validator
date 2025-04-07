import { languages } from "../../data/languages/db";
import type { LanguageData } from "../../types";

const aliasMap: Record<string, LanguageData> = {};

for (const lang of languages) {
  // Add all codes to the alias map
  aliasMap[lang.iso639_1.toLowerCase()] = lang;
  if (lang.iso639_2) aliasMap[lang.iso639_2.toLowerCase()] = lang;
  if (lang.iso639_3) aliasMap[lang.iso639_3.toLowerCase()] = lang;
  
  // Add all aliases
  for (const alias of lang.aliases) {
    aliasMap[alias.toLowerCase()] = lang;
  }
}

export function normalizeLanguageCode(input: string): LanguageData | undefined {
  if (!input) return undefined;
  return aliasMap[input.toLowerCase()];
}
