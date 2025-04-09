import type { FuzzyMatch, ScriptData } from "../../types";
import { containsAllCharsInOrder, containsWordMatch, levenshteinDistance } from "../../utils";

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

    // Gather all candidates to match against
    const candidates = [
      script.code.toLowerCase(),
      script.name.toLowerCase(),
      ...(script.aliases || []).map((a) => a.toLowerCase()),
    ];

    // Find best match among candidates
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestRank = Number.POSITIVE_INFINITY;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (!candidate) continue;

      let distance = Number.POSITIVE_INFINITY;

      // 1. Exact match was handled above

      // 2. Word match
      if (containsWordMatch(candidate, normalized)) {
        distance = 1;
      }
      // 3. "Starts with" or "chars in order" for short input
      else if (candidate.length >= normalized.length) {
        if (candidate.startsWith(normalized)) {
          distance = 1;
        } else if (normalized.length <= 3 && containsAllCharsInOrder(candidate, normalized)) {
          // e.g. "lat" -> "latin"
          const diff = Math.abs(candidate.length - normalized.length);
          // If length difference is small enough
          distance = diff <= 2 ? diff : Number.POSITIVE_INFINITY;
        }
      }
      // 4. Levenshtein distance
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

  // Sort by distance, then rank, then code
  const sorted = matches.sort((a, b) => {
    const distanceDiff = a.distance - b.distance;
    if (distanceDiff !== 0) return distanceDiff;

    const rankDiff = a.rank - b.rank;
    if (rankDiff !== 0) return rankDiff;

    return a.code.localeCompare(b.code);
  });

  return sorted;
}
