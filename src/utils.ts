/**
 * MODIFY: Minimal helpers (e.g., custom errors)
 */

import type { LanguageData } from "./types";

/**
 * Custom error types for i18n validation
 */
export class I18nValidationError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "I18nValidationError";
  }
}

export class InvalidLanguageError extends I18nValidationError {
  constructor(code: string) {
    super(`Invalid language code: ${code}`, code);
    this.name = "InvalidLanguageError";
  }
}

export class InvalidRegionError extends I18nValidationError {
  constructor(code: string) {
    super(`Invalid region code: ${code}`, code);
    this.name = "InvalidRegionError";
  }
}

export class InvalidScriptError extends I18nValidationError {
  constructor(code: string) {
    super(`Invalid script code: ${code}`, code);
    this.name = "InvalidScriptError";
  }
}

/**
 * Input validation helpers
 */
export function validateInput(input: unknown, type: "language" | "region" | "script"): string {
  if (typeof input !== "string") {
    throw new I18nValidationError(`${type} code must be a string`);
  }
  if (!input.trim()) {
    throw new I18nValidationError(`${type} code cannot be empty`);
  }
  return input.trim();
}

/**
 * Normalize a string to lowercase, trimmed, and without special characters
 */
export function normalizeString(input: string): string {
  if (!input) return "";
  return input.trim().toLowerCase();
}

/**
 * Check if a string is empty or whitespace only
 */
export function isEmpty(input: string | null | undefined): boolean {
  return input === null || input === undefined || input.trim() === "";
}
