/**
 * Script-specific language groups
 * Groups languages by their common writing systems
 * @module
 */
import { mapLanguageCodes } from "../core/utils";

/**
 * Languages primarily using Latin script (Latn)
 * Includes major European and Latin American languages
 */
export const latinScriptLanguages = mapLanguageCodes([
  "en", // English
  "es", // Spanish
  "fr", // French
  "de", // German
  "it", // Italian
  "pt", // Portuguese
  "vi", // Vietnamese
  "id", // Indonesian
]);

/**
 * Languages using Cyrillic script (Cyrl)
 * Includes languages from Eastern Europe and Northern Asia
 */
export const cyrillicScriptLanguages = mapLanguageCodes([
  "ru", // Russian
  "uk", // Ukrainian
  "bg", // Bulgarian
  "sr", // Serbian
  "mk", // Macedonian
]);

/**
 * Languages using Chinese, Japanese, or Korean scripts
 * Includes Han (Hani), Hiragana (Hira), Katakana (Kana), Hangul (Hang)
 */
export const cjkScriptLanguages = mapLanguageCodes([
  "zh", // Chinese (Hans/Hant)
  "ja", // Japanese (Hani/Hira/Kana)
  "ko", // Korean (Hang/Hani)
]);

/**
 * Languages using Arabic script (Arab)
 * Includes languages from Middle East, North Africa, and parts of Asia
 */
export const arabicScriptLanguages = mapLanguageCodes([
  "ar", // Arabic
  "fa", // Persian
  "ur", // Urdu
  "ku", // Kurdish
]);

/**
 * Languages using Devanagari script (Deva)
 * Includes languages from India and Nepal
 */
export const devanagariScriptLanguages = mapLanguageCodes([
  "hi", // Hindi
  "mr", // Marathi
  "ne", // Nepali
  "sa", // Sanskrit
]);
