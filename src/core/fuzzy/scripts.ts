import type { FuzzyMatch, ScriptData } from "../../types";
import { levenshteinDistance } from "./levenshtein";

/**
 * Script-specific common variations for fuzzy matching
 */
const COMMON_SCRIPT_VARIATIONS: Record<string, string[]> = {
  Latn: ["latin", "roman", "latin alphabet", "roman alphabet", "latin script"],
  Cyrl: ["cyrillic", "cyrillic alphabet", "cyrillic script", "russian alphabet"],
  Hans: ["simplified chinese", "simplified han", "simplified", "simplified characters"],
  Hant: ["traditional chinese", "traditional han", "traditional", "traditional characters"],
  Arab: ["arabic", "arabic script", "arabic alphabet"],
  Jpan: ["japanese", "japanese script", "japanese writing"],
  Kore: ["korean", "korean script", "korean writing", "hangul"],
  Deva: ["devanagari", "devanagari script", "devnagari", "nagari"],
};

/**
 * Checks if input string contains all characters of search string in order
 */
function containsAllCharsInOrder(str: string, search: string): boolean {
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
function containsWordMatch(str: string, search: string): boolean {
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

/**
 * Fuzzy match a script input against available scripts
 *
 * @param input User input to match
 * @param availableScripts Map of available script data from config
 * @param maxDistance Maximum Levenshtein distance to consider
 * @returns Array of matched scripts sorted by relevance
 */
export function fuzzyMatchScript(
  input: string,
  availableScripts: Map<string, ScriptData>,
  maxDistance = 2,
): FuzzyMatch[] {
  const normalized = input.toLowerCase().trim();
  if (!normalized) return [];

  // Dynamic max distance based on input length
  const effectiveMaxDistance = Math.min(
    normalized.length > 3 ? maxDistance + 1 : maxDistance,
    Math.floor(normalized.length / 2) + 1,
  );

  const matches: FuzzyMatch[] = [];

  // For exact matches
  let hasExactMatch = false;
  const exactCodes = new Set<string>();

  // First pass: check for exact matches
  for (const [code, script] of availableScripts.entries()) {
    // Check for exact code matches first
    if (script.code.toLowerCase() === normalized) {
      hasExactMatch = true;
      exactCodes.add(code);
      matches.push({
        code: script.code,
        distance: 0,
        type: "script",
        data: script,
        rank: 0,
      });
    } else if (
      script.name.toLowerCase() === normalized ||
      script.aliases?.some((alias) => alias.toLowerCase() === normalized)
    ) {
      hasExactMatch = true;
      exactCodes.add(code);
      matches.push({
        code: script.code,
        distance: 0,
        type: "script",
        data: script,
        rank: 1,
      });
    } else if (COMMON_SCRIPT_VARIATIONS[script.code] && COMMON_SCRIPT_VARIATIONS[script.code].includes(normalized)) {
      hasExactMatch = true;
      exactCodes.add(code);
      matches.push({
        code: script.code,
        distance: 0,
        type: "script",
        data: script,
        rank: 2,
      });
    }
  }

  // If we have exact matches, don't bother with fuzzy matches
  if (hasExactMatch) {
    return matches.sort((a, b) => {
      const rankDiff = a.rank - b.rank;
      if (rankDiff !== 0) return rankDiff;
      return a.code.localeCompare(b.code);
    });
  }

  // Process each available script for fuzzy matches
  for (const [code, script] of availableScripts.entries()) {
    // Skip if we already had an exact match for this code
    if (exactCodes.has(code)) continue;

    // Special case: detect if user is searching with 'script' or 'alphabet' terms
    const searchingForScriptType =
      normalized.includes("script") || normalized.includes("alphabet") || normalized.includes("writing");

    // Gather all candidates to match against
    const candidates = [
      script.code.toLowerCase(),
      script.name.toLowerCase(),
      ...(script.aliases || []).map((a) => a.toLowerCase()),
    ];

    // Add common variations for well-known scripts
    if (COMMON_SCRIPT_VARIATIONS[script.code]) {
      candidates.push(...COMMON_SCRIPT_VARIATIONS[script.code]);
    }

    // Add additional variations based on context
    if (searchingForScriptType) {
      // If user is searching for a script/alphabet, add variations without those terms
      const nameWithoutScript = script.name.toLowerCase().replace(/\s*(script|alphabet|writing)\s*/g, "");
      candidates.push(nameWithoutScript);
    } else if (!script.name.toLowerCase().includes("script") && !script.name.toLowerCase().includes("alphabet")) {
      // If user doesn't mention script/alphabet and the script name doesn't have it,
      // add variations with those terms
      candidates.push(`${script.name.toLowerCase()} script`);
      candidates.push(`${script.name.toLowerCase()} alphabet`);
    }

    // Find best match among candidates
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestRank = Number.POSITIVE_INFINITY;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (!candidate) continue;

      let distance = Number.POSITIVE_INFINITY;

      // Word match
      if (containsWordMatch(candidate, normalized)) {
        distance = 1;
      }
      // "Starts with" or "chars in order" for short input
      else if (candidate.length >= normalized.length) {
        if (candidate.startsWith(normalized)) {
          distance = 1;
        } else if (normalized.length <= 3 && containsAllCharsInOrder(candidate, normalized)) {
          const diff = Math.abs(candidate.length - normalized.length);
          // If length difference is small enough
          distance = diff <= 2 ? diff : Number.POSITIVE_INFINITY;
        }
      }
      // Levenshtein distance
      if (
        distance === Number.POSITIVE_INFINITY &&
        Math.abs(candidate.length - normalized.length) <= effectiveMaxDistance
      ) {
        const lev = levenshteinDistance(normalized, candidate, effectiveMaxDistance);
        if (lev !== Number.POSITIVE_INFINITY) {
          distance = lev;
        }
      }

      // Update best match
      if (distance < bestDistance) {
        bestDistance = distance;
        bestRank = i; // Lower index = higher priority candidate
      }
    }

    // If found a good match, add it
    if (bestDistance !== Number.POSITIVE_INFINITY && bestDistance <= effectiveMaxDistance) {
      matches.push({
        code: script.code,
        distance: bestDistance,
        type: "script",
        data: script,
        rank: bestRank,
      });
    }
  }

  // For some specific inputs, return only the best match
  // This improves precision for common scripts
  const requirePreciseMatch = [
    "latn",
    "cyrl",
    "hans",
    "hant",
    "arab",
    "jpan", // Common script codes
    "latin",
    "cyrillic",
    "arabic",
    "chinese", // Common script names
    "simplified",
    "traditional",
    "roman",
    "devanagari", // More script names
    "japanese",
    "korean",
    "hangul", // Language/script names
  ].includes(normalized);

  // Sort by distance, then rank, then code
  const sorted = matches.sort((a, b) => {
    const distanceDiff = a.distance - b.distance;
    if (distanceDiff !== 0) return distanceDiff;

    // For equal distances, prioritize common scripts
    const aIsCommon = ["Latn", "Cyrl", "Hans", "Hant", "Arab"].includes(a.code);
    const bIsCommon = ["Latn", "Cyrl", "Hans", "Hant", "Arab"].includes(b.code);
    if (aIsCommon !== bIsCommon) return aIsCommon ? -1 : 1;

    // Then by rank
    const rankDiff = a.rank - b.rank;
    if (rankDiff !== 0) return rankDiff;

    return a.code.localeCompare(b.code);
  });

  // For specific inputs, return only the best match
  if (requirePreciseMatch && sorted.length > 0) {
    return [sorted[0]];
  }

  return sorted;
}
