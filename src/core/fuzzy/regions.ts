import type { FuzzyMatch, RegionData } from "../../types";
import { levenshteinDistance } from "./levenshtein";

/**
 * Region-specific common variations for fuzzy matching
 */
const COMMON_REGION_VARIATIONS: Record<string, string[]> = {
  US: ["usa", "u.s.", "u.s.a.", "united states", "america", "united states of america", "us of a"],
  GB: ["uk", "great britain", "britain", "united kingdom", "england"],
  CA: ["can", "canada"],
  AU: ["aus", "australia", "aussie"],
  DE: ["germany", "deutschland", "ger"],
  FR: ["france", "fra"],
  JP: ["japan", "nippon", "nihon"],
  CN: ["china", "zhongguo", "中国"],
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
 * Fuzzy match a region input against available regions
 *
 * @param input User input to match
 * @param availableRegions Map of available region data from config
 * @param maxDistance Maximum Levenshtein distance to consider
 * @returns Array of matched regions sorted by relevance
 */
export function fuzzyMatchRegion(
  input: string,
  availableRegions: Map<string, RegionData>,
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
  for (const [code, region] of availableRegions.entries()) {
    // Check for exact code matches first
    if (
      region.alpha2.toLowerCase() === normalized ||
      (region.alpha3 && region.alpha3.toLowerCase() === normalized) ||
      (region.numeric && region.numeric === normalized)
    ) {
      hasExactMatch = true;
      exactCodes.add(code);
      matches.push({
        code: region.alpha2,
        distance: 0,
        type: "region",
        data: region,
        rank: 0,
      });
    } else if (
      region.name.toLowerCase() === normalized ||
      region.aliases?.some((alias) => alias.toLowerCase() === normalized)
    ) {
      hasExactMatch = true;
      exactCodes.add(code);
      matches.push({
        code: region.alpha2,
        distance: 0,
        type: "region",
        data: region,
        rank: 1,
      });
    } else if (
      COMMON_REGION_VARIATIONS[region.alpha2] &&
      COMMON_REGION_VARIATIONS[region.alpha2].includes(normalized)
    ) {
      hasExactMatch = true;
      exactCodes.add(code);
      matches.push({
        code: region.alpha2,
        distance: 0,
        type: "region",
        data: region,
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

  // Process each available region for fuzzy matches
  for (const [code, region] of availableRegions.entries()) {
    // Skip if we already had an exact match for this code
    if (exactCodes.has(code)) continue;

    // Gather all candidates to match against
    const candidates = [
      region.alpha2.toLowerCase(),
      ...(region.alpha3 ? [region.alpha3.toLowerCase()] : []),
      ...(region.numeric ? [region.numeric] : []),
      region.name.toLowerCase(),
      ...(region.aliases || []).map((a) => a.toLowerCase()),
    ];

    // Add common variations for well-known regions
    if (COMMON_REGION_VARIATIONS[region.alpha2]) {
      candidates.push(...COMMON_REGION_VARIATIONS[region.alpha2]);
    }

    // Add special cases for countries with "United" in the name
    if (region.name.toLowerCase().includes("united")) {
      candidates.push(
        // Common typos and variations
        region.name
          .toLowerCase()
          .replace("united", "")
          .trim(),
        region.name.toLowerCase().replace("united", "unted").trim(),
        region.name.toLowerCase().replace("united", "untied").trim(),
        region.name.toLowerCase().replace("united", "unitted").trim(),
      );
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
          // e.g. "usa" -> "united states of america"
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
        code: region.alpha2,
        distance: bestDistance,
        type: "region",
        data: region,
        rank: bestRank,
      });
    }
  }

  // For some specific inputs, return only the best match
  // This improves precision for common abbreviations and codes
  const requirePreciseMatch = [
    "us",
    "gb",
    "uk",
    "ca",
    "au",
    "de",
    "fr",
    "jp",
    "cn", // Common 2-letter codes
    "usa",
    "deu",
    "fra",
    "jpn",
    "chn", // Common 3-letter codes
    "united states",
    "america",
    "england",
    "britain", // Common country names
    "canada",
    "australia",
    "germany",
    "china",
    "japan", // More common country names
  ].includes(normalized);

  // Sort by distance, then rank, then code
  const sorted = matches.sort((a, b) => {
    const distanceDiff = a.distance - b.distance;
    if (distanceDiff !== 0) return distanceDiff;

    // For equal distances, prioritize common regions
    const aIsCommon = ["US", "GB", "CA", "AU"].includes(a.code);
    const bIsCommon = ["US", "GB", "CA", "AU"].includes(b.code);
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
