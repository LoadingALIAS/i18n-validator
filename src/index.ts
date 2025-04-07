/** 
 * Core language and region validation/normalization
 */
export {
  normalizeLanguageCode,
} from "./core/languages/normalize";
export {
  isValidLanguageCode,
} from "./core/languages/validate";
export {
  normalizeRegionCode,
} from "./core/regions/normalize";
export {
  isValidRegionCode,
} from "./core/regions/validate";

/**
 * Script validation and normalization
 */
export {
  isValidScriptCode,
  normalizeScriptCode,
  getScriptData,
} from "./core/scripts/validate";

/**
 * Combined validation with feedback
 */
export {
  validateWithFeedback,
} from "./core/validateWithFeedback";

/**
 * BCP47 tag parsing and validation
 */
export {
  parseBCP47,
  parseBCP47WithFeedback,
  type ParsedBCP47,
  type ParsedBCP47WithFeedback,
} from "./bcp47/parser";
export {
  validateBCP47,
} from "./bcp47/validate";

/**
 * Fuzzy matching functionality
 */
export {
  fuzzyMatch,
} from "./core/fuzzy/matcher";

/**
 * Caching functionality
 */
export {
  ValidationCache,
} from "./core/cache";

/**
 * Data types and interfaces
 */
export type {
  LanguageData,
  RegionData,
  ScriptData,
  NormalizedResult,
  ValidationFeedback,
  FuzzyMatch,
  CacheOptions,
} from "./types";

/**
 * Language and region databases
 */
export * from "./data/languages/db";
export * from "./data/regions/db";
export * from "./data/scripts/db";

/**
 * Common language groups for partial imports
 */
export * from "./groups/common";
export * from "./groups/byRegion";
export * from "./groups/byScript";
