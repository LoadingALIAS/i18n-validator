/**
 * i18n-validator - Lightweight, tree-shakeable validation for languages, regions & scripts
 *
 * This library provides validation, normalization, and suggestion functionality for
 * internationalization codes (languages, regions, and scripts). It uses a dynamic data
 * loading approach to keep bundle size minimal.
 */

// Core API exports

/**
 * Configure the library with specific data sets.
 * This function must be called before using parse, suggest, or validate functions.
 * It dynamically loads only the data for the languages, regions, and scripts you specify.
 *
 * @example
 * // Load only English, Spanish, and French data
 * await configure({
 *   languages: ['en', 'es', 'fr'],
 *   regions: ['US', 'ES', 'FR', 'GB'],
 *   scripts: ['Latn']
 * });
 */
export { configure } from "./core/config";

/**
 * Parse and validate a string input into its BCP 47 components.
 * Returns a detailed breakdown of the parsed components, validation feedback,
 * and a normalized BCP 47 tag if valid.
 *
 * @example
 * // Parse "english us"
 * const result = parse("english us");
 * // result = {
 * //   language: { code: "en", valid: true, ... },
 * //   region: { code: "US", valid: true, ... },
 * //   script: null,
 * //   normalizedTag: "en-US",
 * //   valid: true,
 * //   feedback: { ... }
 * // }
 */
export { parse } from "./core/parser";

/**
 * Suggest matching language, region, script codes, or BCP 47 tags for a given input.
 * Useful for autocomplete, correction suggestions, or "did you mean?" features.
 *
 * @example
 * // Suggest languages for "eng"
 * const suggestions = suggest("eng", { type: "language" });
 * // suggestions = ["en", "de", "fr", ...]
 *
 * // Suggest BCP 47 tags for "english united"
 * const tags = suggestBCP47("english united");
 * // tags = ["en-US", "en-GB", ...]
 */
export { suggest, suggestBCP47, type SuggestOptions, type SuggestionType } from "./core/suggest";

/**
 * Simple validation of language, region, script codes, or complete BCP 47 tags.
 * Returns a boolean indicating whether the input is valid.
 *
 * @example
 * // Validate a language code
 * const isValid = validate("en", "language"); // true
 *
 * // Validate a BCP 47 tag
 * const isValidTag = validateBCP47("en-US"); // true
 */
export { validate, validateBCP47, type ValidationType } from "./core/validate";

// Types
export type {
  LanguageData,
  RegionData,
  ScriptData,
  ValidationFeedback,
  FuzzyMatch,
} from "./types";
