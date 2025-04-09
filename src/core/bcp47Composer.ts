import type { LanguageData, RegionData, ScriptData } from "../types";

/**
 * Compose a BCP 47 language tag from separate language, script, and region components.
 * Handles script suppression per the BCP 47 spec.
 *
 * @param lang The language component
 * @param script Optional script component
 * @param region Optional region component
 * @returns A properly formatted BCP 47 tag
 */
export function composeBCP47(lang: LanguageData, script?: ScriptData, region?: RegionData): string {
  if (!lang) {
    throw new Error("Language component is required for BCP 47 composition");
  }

  const parts: string[] = [lang.iso639_1];

  // Add script unless it's the suppressed script for this language
  if (script) {
    const scriptCode = script.code;
    const suppressedScript = lang.suppressScript;

    // Only include script if it differs from the language's default (suppressed) script
    if (!suppressedScript || suppressedScript !== scriptCode) {
      parts.push(scriptCode);
    }
  }

  // Add region if provided
  if (region) {
    parts.push(region.alpha2);
  }

  return parts.join("-");
}
