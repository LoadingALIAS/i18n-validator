import { languages } from "../../languages/db";
import type { LanguageData } from "../../types";

const aliasMap: Record<string, LanguageData> = {};

for (const lang of languages) {
  for (const alias of lang.aliases) {
    aliasMap[alias.toLowerCase()] = lang;
  }
}

export function normalizeLanguageCode(input: string): LanguageData | undefined {
  return aliasMap[input.toLowerCase()];
}
