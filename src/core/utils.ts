/**
 * Shared utility functions for language code mapping and validation
 */
import { normalizeLanguageCode } from "./languages/normalize";
import type { LanguageData } from "../types";

/**
 * Maps an array of language codes to their normalized BCP47 form
 * @param codes Array of language codes to normalize
 * @param options Optional configuration for the mapping process
 * @returns Array of normalized BCP47 language codes
 * @throws {Error} If any language code is invalid
 */
export function mapLanguageCodes(
  codes: string[],
  options: {
    throwOnInvalid?: boolean;
    includeData?: boolean;
  } = { throwOnInvalid: true, includeData: false }
): string[] {
  return codes.map((code) => {
    const lang = normalizeLanguageCode(code);
    if (!lang && options.throwOnInvalid) {
      throw new InvalidLanguageError(code);
    }
    return lang?.bcp47 || code;
  });
}

/**
 * Maps an array of language codes to their normalized form with full data
 * @param codes Array of language codes to normalize
 * @returns Array of normalized language data
 * @throws {Error} If any language code is invalid
 */
export function mapLanguageCodesWithData(
  codes: string[]
): Array<{ code: string; data: LanguageData | null }> {
  return codes.map((code) => {
    const lang = normalizeLanguageCode(code);
    return { code: lang?.bcp47 || code, data: lang || null };
  });
}

/**
 * Creates a validator function for a subset of language codes
 * @param languageCodes Array of valid language codes
 * @returns Object with validation function
 */
export function createLanguageValidator(languageCodes: string[]) {
  const normalizedCodes = new Set(mapLanguageCodes(languageCodes));
  
  return {
    isValidLanguageCode: (code: string): boolean => {
      const normalized = normalizeLanguageCode(code);
      if (!normalized) return false;
      return normalizedCodes.has(normalized.bcp47);
    },
  };
}

/**
 * Custom error types for i18n validation
 */
export class I18nValidationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'I18nValidationError';
  }
}

export class InvalidLanguageError extends I18nValidationError {
  constructor(code: string) {
    super(`Invalid language code: ${code}`, code);
    this.name = 'InvalidLanguageError';
  }
}

export class InvalidRegionError extends I18nValidationError {
  constructor(code: string) {
    super(`Invalid region code: ${code}`, code);
    this.name = 'InvalidRegionError';
  }
}

export class InvalidScriptError extends I18nValidationError {
  constructor(code: string) {
    super(`Invalid script code: ${code}`, code);
    this.name = 'InvalidScriptError';
  }
}

/**
 * Input validation helpers
 */
export function validateInput(input: unknown, type: 'language' | 'region' | 'script'): string {
  if (typeof input !== 'string') {
    throw new I18nValidationError(`${type} code must be a string`);
  }
  if (!input.trim()) {
    throw new I18nValidationError(`${type} code cannot be empty`);
  }
  return input.trim();
} 