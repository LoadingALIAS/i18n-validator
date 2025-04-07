/**
 * Common language groups for partial imports
 * These groups allow developers to load only the language codes they need,
 * enabling better tree-shaking and smaller bundle sizes.
 * @module
 */
import { mapLanguageCodes, createLanguageValidator } from "../core/utils";

/**
 * Most widely used languages globally based on number of speakers
 * and internet usage statistics
 */
export const commonLanguages = mapLanguageCodes([
  "en", // English
  "es", // Spanish
  "zh", // Chinese
  "hi", // Hindi
  "ar", // Arabic
  "bn", // Bengali
  "pt", // Portuguese
  "ru", // Russian
  "ja", // Japanese
  "fr", // French
]);

/**
 * Most commonly used European languages
 * Includes official EU languages and other major European languages
 */
export const europeanLanguages = mapLanguageCodes([
  "en", // English
  "fr", // French
  "de", // German
  "es", // Spanish
  "it", // Italian
  "pt", // Portuguese
  "pl", // Polish
  "nl", // Dutch
  "el", // Greek
  "hu", // Hungarian
]);

/**
 * Major Asian languages by number of speakers
 * Includes languages from East Asia, South Asia, and Southeast Asia
 */
export const asianLanguages = mapLanguageCodes([
  "zh", // Chinese
  "ja", // Japanese
  "ko", // Korean
  "hi", // Hindi
  "bn", // Bengali
  "ur", // Urdu
  "th", // Thai
  "vi", // Vietnamese
  "ta", // Tamil
  "id", // Indonesian
]);

/**
 * Creates a validator for a subset of languages
 * @param languageCodes Array of language codes to validate against
 * @returns Object with validation function
 * @example
 * ```typescript
 * const validator = createValidator(['en', 'fr', 'es']);
 * validator.isValidLanguageCode('en-US'); // true
 * validator.isValidLanguageCode('de'); // false
 * ```
 */
export const createValidator = createLanguageValidator;
