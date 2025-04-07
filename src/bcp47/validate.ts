import { parseBCP47 } from "./parser";
import { isValidScriptCode } from "../core/scripts/validate";

/**
 * Validates whether a given BCP 47 string is fully recognized and valid.
 * Supports formats:
 * - language (e.g., "en")
 * - language-region (e.g., "en-US")
 * - language-script (e.g., "zh-Hant")
 * - language-script-region (e.g., "zh-Hant-HK")
 */
export function validateBCP47(tag: string): boolean {
  // Basic format validation
  if (!/^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-[a-zA-Z]{2}|\d{3})?$/.test(tag)) {
    return false;
  }

  // Parse and validate components
  const parsed = parseBCP47(tag);
  if (!parsed) return false;

  // Additional validation for script codes
  if (parsed.script && !isValidScriptCode(parsed.script)) {
    return false;
  }

  return true;
}
