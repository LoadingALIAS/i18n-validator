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

/**
 * Optimized Levenshtein distance with linear space and early termination
 *
 * @param a First string to compare
 * @param b Second string to compare
 * @param maxDistance Maximum edit distance to consider (for early termination)
 * @returns The edit distance, or Infinity if it exceeds maxDistance
 */
export function levenshteinDistance(a: string, b: string, maxDistance: number): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length <= maxDistance ? b.length : Number.POSITIVE_INFINITY;
  if (b.length === 0) return a.length <= maxDistance ? a.length : Number.POSITIVE_INFINITY;

  // Use the shorter string as row for minimal memory
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  const row = Array(short.length + 1)
    .fill(0)
    .map((_, i) => i);

  for (let i = 1; i <= long.length; i++) {
    let prev = i;
    let minInRow = i;
    for (let j = 1; j <= short.length; j++) {
      const substitutionCost = short[j - 1] === long[i - 1] ? 0 : 1;
      const next = Math.min(
        row[j] + 1, // deletion
        prev + 1, // insertion
        row[j - 1] + substitutionCost, // substitution
      );
      row[j - 1] = prev;
      prev = next;
      minInRow = Math.min(minInRow, next);
    }
    row[short.length] = prev;
    if (minInRow > maxDistance) return Number.POSITIVE_INFINITY; // Early termination
  }
  return row[short.length] <= maxDistance ? row[short.length] : Number.POSITIVE_INFINITY;
}

/**
 * Checks if input string contains all characters of search string in order
 */
export function containsAllCharsInOrder(str: string, search: string): boolean {
  const lowerStr = str.toLowerCase();
  const lowerSearch = search.toLowerCase();
  let j = 0;
  for (let i = 0; i < lowerStr.length && j < lowerSearch.length; i++) {
    if (lowerStr[i] === lowerSearch[j]) j++;
  }
  return j === lowerSearch.length;
}

/**
 * Checks if search is matched as a word or substring in str
 */
export function containsWordMatch(str: string, search: string): boolean {
  const lowerStr = str.toLowerCase().trim();
  const lowerSearch = search.toLowerCase().trim();

  // Quick exact matches
  if (lowerStr === lowerSearch) return true;
  if (lowerStr.startsWith(lowerSearch)) return true;
  if (lowerSearch.startsWith(lowerStr)) return true;

  // Split into words
  const words = lowerStr.split(/\s+/);
  const searchWords = lowerSearch.split(/\s+/);

  // Single-word logic
  if (searchWords.length === 1) {
    // For very short search terms (<=4 chars), be more lenient with matching
    const maxDistance = lowerSearch.length <= 4 ? 1 : 2;

    for (const word of words) {
      if (word === lowerSearch) return true;
      if (word.startsWith(lowerSearch)) return true;
      if (lowerSearch.startsWith(word)) return true;

      // For short words, check if they're a substring of longer words
      if (lowerSearch.length <= 4 && word.includes(lowerSearch)) return true;

      // For longer search terms, use character matching and levenshtein
      if (lowerSearch.length > 2) {
        if (containsAllCharsInOrder(word, lowerSearch)) return true;
        const distance = levenshteinDistance(lowerSearch, word, maxDistance);
        if (distance !== Number.POSITIVE_INFINITY) return true;
      }
    }
    return false;
  }

  // Multi-word logic with improved partial matching
  let matchCount = 0;
  let lastMatchIndex = -1;
  const maxWordDistance = Math.min(2, Math.floor(searchWords[0].length / 2));

  for (const searchWord of searchWords) {
    let found = false;
    for (let i = lastMatchIndex + 1; i < words.length && !found; i++) {
      const wordDistance = levenshteinDistance(words[i], searchWord, maxWordDistance);
      if (
        words[i] === searchWord ||
        words[i].startsWith(searchWord) ||
        searchWord.startsWith(words[i]) ||
        (searchWord.length > 2 && containsAllCharsInOrder(words[i], searchWord)) ||
        wordDistance !== Number.POSITIVE_INFINITY
      ) {
        matchCount++;
        lastMatchIndex = i;
        found = true;
      }
    }
    if (!found) return false;
  }
  return matchCount === searchWords.length;
}
