import { parseBCP47 } from "./parser";

/**
 * Validates whether a given BCP 47 string is fully recognized and valid.
 * Supports format: language[-script][-region]
 */
export function validateBCP47(tag: string): boolean {
  // Reject if non-canonical formatting (underscores, extra hyphens, etc.)
  if (!/^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-[a-zA-Z]{2}|\d{3})?$/.test(tag))
    return false;

  const parsed = parseBCP47(tag);
  return !!parsed;
}
