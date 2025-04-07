/**
 * Region-specific language groups
 * Groups languages commonly used in specific regions or countries
 * @module
 */
import { mapLanguageCodes } from "../core/utils";

/**
 * Languages commonly used in North America
 * Includes official languages of USA, Canada, and Mexico
 */
export const northAmericanLanguages = mapLanguageCodes([
  "en", // English (USA, Canada)
  "es", // Spanish (Mexico, USA)
  "fr", // French (Canada)
]);

/**
 * Languages of the Indian subcontinent
 * Includes major languages from India, Pakistan, Bangladesh, and Sri Lanka
 */
export const indianSubcontinentLanguages = mapLanguageCodes([
  "hi", // Hindi
  "bn", // Bengali
  "ur", // Urdu
  "ta", // Tamil
  "te", // Telugu
  "mr", // Marathi
  "gu", // Gujarati
  "kn", // Kannada
  "ml", // Malayalam
  "pa", // Punjabi
]);

/**
 * Major East Asian languages
 * Includes languages from China, Japan, and Korea
 */
export const eastAsianLanguages = mapLanguageCodes([
  "zh", // Chinese (Mandarin)
  "ja", // Japanese
  "ko", // Korean
]);

/**
 * Languages commonly used in the Middle East
 * Includes major languages from Arab countries, Iran, Israel, and Turkey
 */
export const middleEasternLanguages = mapLanguageCodes([
  "ar", // Arabic
  "fa", // Persian
  "he", // Hebrew
  "tr", // Turkish
  "ku", // Kurdish
]);
