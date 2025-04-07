import { languages } from "../../data/languages/db";
import { regions } from "../../data/regions/db";
import { scripts } from "../../data/scripts/db";
import type { LanguageData, RegionData, ScriptData, FuzzyMatch } from "../../types";

/**
 * Optimized Levenshtein distance with linear space and early termination
 */
function levenshteinDistance(a: string, b: string, maxDistance: number): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length <= maxDistance ? b.length : Infinity;
  if (b.length === 0) return a.length <= maxDistance ? a.length : Infinity;

  // Use the shorter string as row for minimal memory
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let row = Array(short.length + 1)
    .fill(0)
    .map((_, i) => i);

  for (let i = 1; i <= long.length; i++) {
    let prev = i;
    let minInRow = i;
    for (let j = 1; j <= short.length; j++) {
      const substitutionCost = short[j - 1] === long[i - 1] ? 0 : 1;
      const next = Math.min(
        row[j] + 1,                   // deletion
        prev + 1,                     // insertion
        row[j - 1] + substitutionCost // substitution
      );
      row[j - 1] = prev;
      prev = next;
      minInRow = Math.min(minInRow, next);
    }
    row[short.length] = prev;
    if (minInRow > maxDistance) return Infinity; // Early termination
  }
  return row[short.length] <= maxDistance ? row[short.length] : Infinity;
}

// Common terms that might indicate script searches
const SCRIPT_SEARCH_INDICATORS = [
  'script', 'writing', 'alphabet', 'traditional', 'simplified', 'latin', 'cyrillic'
];

/**
 * Enhanced fuzzy matcher optimized for size, speed, and accuracy
 * Now supports matching scripts in addition to languages and regions
 */
export function fuzzyMatch(input: string, maxDistance = 2): FuzzyMatch[] {
  const normalized = input.toLowerCase().trim();
  if (!normalized) return [];

  // Dynamic max distance based on input length
  const effectiveMaxDistance = Math.min(
    normalized.length > 3 ? maxDistance + 1 : maxDistance,
    Math.floor(normalized.length / 2) + 1
  );

  const matches: FuzzyMatch[] = [];
  const isShortInput = normalized.length <= 3;
  // If 2-3 letters, we often want region codes first (US, GB, AE, etc.)
  const prioritizeRegions = isShortInput || /^[a-z]{2,3}$/.test(normalized);
  
  // Special case: If input is 4 characters, it might be a script code
  const mightBeScript = normalized.length === 4 || 
    SCRIPT_SEARCH_INDICATORS.some(term => normalized.includes(term));

  // Helper: check if "search" chars appear in "str" in order
  function containsAllCharsInOrder(str: string, search: string): boolean {
    str = str.toLowerCase();
    search = search.toLowerCase();
    let j = 0;
    for (let i = 0; i < str.length && j < search.length; i++) {
      if (str[i] === search[j]) j++;
    }
    return j === search.length;
  }

  // Helper: check if "search" is matched as a word or substring in "str"
  function containsWordMatch(str: string, search: string): boolean {
    str = str.toLowerCase().trim();
    search = search.toLowerCase().trim();

    // Quick exact matches
    if (str === search) return true;
    if (str.startsWith(search)) return true;
    if (search.startsWith(str)) return true;

    // Split into words
    const words = str.split(/\s+/);
    const searchWords = search.split(/\s+/);

    // Single-word logic
    if (searchWords.length === 1) {
      // For very short search terms (<=4 chars), be more lenient with matching
      const maxDistance = search.length <= 4 ? 1 : 2;
      
      for (const word of words) {
        if (word === search) return true;
        if (word.startsWith(search)) return true;
        if (search.startsWith(word)) return true;

        // For short words, check if they're a substring of longer words
        if (search.length <= 4 && word.includes(search)) return true;

        // For longer search terms, use character matching and levenshtein
        if (search.length > 2) {
          if (containsAllCharsInOrder(word, search)) return true;
          const distance = levenshteinDistance(search, word, maxDistance);
          if (distance <= maxDistance) return true;
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
          wordDistance <= maxWordDistance
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
   * Process an array of language/region/script items, collecting up to one best match per item.
   */
  function processCandidates<T extends LanguageData | RegionData | ScriptData>(
    items: T[],
    type: "language" | "region" | "script",
    getCandidates: (item: T) => string[],
    getCode: (item: T) => string
  ) {
    for (const item of items) {
      const candidates = getCandidates(item);
      // If short input is found, allow only distance=1 for region, else use the normal max
      const itemMaxDistance = 
        type === "region" && normalized.length <= 3
          ? 1
          : effectiveMaxDistance;

      let bestDistance = Infinity;
      let bestRank = Infinity;

      // We'll store the best candidate we find for this item
      for (let cIndex = 0; cIndex < candidates.length; cIndex++) {
        const candidate = candidates[cIndex];
        if (!candidate) continue;

        const normalizedCandidate = candidate.toLowerCase().trim();
        if (!normalizedCandidate) continue;

        let distance = Infinity;

        // 1) Exact match
        if (normalizedCandidate === normalized) {
          distance = 0;
        } else {
          // 2) Region word match with improved partial matching
          if (type === "region") {
            if (containsWordMatch(normalizedCandidate, normalized)) {
              distance = 1;
            }
            else if (
              // Check if input is a partial match of any word in the region's name
              "name" in item && 
              item.name.toLowerCase().split(/\s+/).some(word => {
                const wordDistance = levenshteinDistance(normalized, word.toLowerCase(), itemMaxDistance);
                if (wordDistance <= itemMaxDistance) {
                  distance = wordDistance;
                  return true;
                }
                return false;
              })
            ) {
              // Distance already set in the some() callback
            }
            else if (
              // direct substring of the region's name
              "name" in item && item.name.toLowerCase().includes(normalized)
            ) {
              distance = 1;
            }
          }

          // 3) Language word match
          if (type === "language" && distance === Infinity) {
            if (containsWordMatch(normalizedCandidate, normalized)) {
              distance = 1;
            }
          }
          
          // 4) Script word match - now handled consistently with languages/regions
          if (type === "script" && distance === Infinity) {
            if (containsWordMatch(normalizedCandidate, normalized)) {
              distance = 1;
            }
            // Check if input is a partial match of any word in the script name
            else if (
              "name" in item && 
              item.name.toLowerCase().split(/\s+/).some(word => {
                const wordDistance = levenshteinDistance(normalized, word.toLowerCase(), itemMaxDistance);
                if (wordDistance <= itemMaxDistance) {
                  distance = wordDistance;
                  return true;
                }
                return false;
              })
            ) {
              // Distance already set in the some() callback
            }
            else if (
              // direct substring of the script's name
              "name" in item && item.name.toLowerCase().includes(normalized)
            ) {
              distance = 1;
            }
          }

          // 5) "starts with" or "chars in order" for short input
          if (distance === Infinity && normalizedCandidate.length >= normalized.length) {
            if (normalizedCandidate.startsWith(normalized)) {
              distance = 1;
            } else if (
              normalized.length <= 3 &&
              containsAllCharsInOrder(normalizedCandidate, normalized)
            ) {
              // e.g. "eng" -> "english"
              const diff = Math.abs(normalizedCandidate.length - normalized.length);
              // If length difference is small enough
              distance = diff <= 2 ? diff : Infinity;
            }
          }

          // 6) If still Infinity, check length difference
          if (
            distance === Infinity &&
            Math.abs(normalizedCandidate.length - normalized.length) <= itemMaxDistance
          ) {
            // 7) fallback to Levenshtein
            const lev = levenshteinDistance(normalized, normalizedCandidate, itemMaxDistance);
            if (lev <= itemMaxDistance) {
              distance = lev;
            }
          }
        }

        // Update best match if this candidate is better
        if (distance < bestDistance) {
          bestDistance = distance;
          bestRank = cIndex;
        }
      }

      // If the best distance is within threshold, add that as our single match for this item
      if (bestDistance !== Infinity && bestDistance <= itemMaxDistance) {
        matches.push({
          code: getCode(item),
          distance: bestDistance,
          type,
          data: item,
          rank: bestRank
        });
      }
    }
  }

  // Processing order based on input characteristics
  if (mightBeScript) {
    // Process scripts first if input looks like a script
    processCandidates<ScriptData>(
      scripts,
      "script",
      (script) => [
        script.code,
        script.name.toLowerCase(),
        ...(script.name.includes(' script') ? [script.name.replace(' script', '')] : []),
        ...(script.name.includes(' alphabet') ? [script.name.replace(' alphabet', '')] : []),
        ...script.aliases
      ],
      (script) => script.code
    );
  }

  // Process languages and regions based on priority
  if (prioritizeRegions) {
    processCandidates<RegionData>(
      regions,
      "region",
      (region) => [
        region.alpha2.toLowerCase(),
        ...(region.alpha3 ? [region.alpha3.toLowerCase()] : []),
        ...(region.numeric ? [region.numeric] : []),
        region.name.toLowerCase(),
        ...region.aliases.map((a) => a.toLowerCase()),
        ...(region.name.toLowerCase().includes("united")
          ? [
              region.name.toLowerCase().replace("united", "").trim(),
              // Add common typos for "united"
              region.name.toLowerCase().replace("united", "unted").trim(),
              region.name.toLowerCase().replace("united", "untied").trim(),
              region.name.toLowerCase().replace("united", "uinted").trim()
            ]
          : []),
        ...(region.name.toLowerCase() === "united kingdom"
          ? ["england", "britain", "great britain"]
          : []),
        ...(region.name.toLowerCase() === "united states"
          ? ["america", "usa", "us of a", "unted states", "untied states", "uinted states"]
          : [])
      ],
      (region) => region.alpha2
    );
    processCandidates<LanguageData>(
      languages,
      "language",
      (lang) => {
        // Start with standard candidates
        const standardCandidates = [
          lang.iso639_1.toLowerCase(),
          lang.iso639_2.toLowerCase(),
          lang.iso639_3.toLowerCase(),
          lang.name.toLowerCase(),
          ...(lang.native ? [lang.native.toLowerCase()] : []),
          ...lang.aliases.map((a) => a.toLowerCase()),
        ];
        
        // Add language-specific variations for common languages
        const extraCandidates = [];
        
        if (lang.name.toLowerCase() === "english") {
          extraCandidates.push("eng", "english language", "englsh");
        } else if (lang.name.toLowerCase() === "spanish") {
          extraCandidates.push("esp", "espanol", "español", "spansh");
        } else if (lang.name.toLowerCase() === "german") {
          extraCandidates.push("deu", "deutsch", "germn", "germa", "grmn");
        } else if (lang.name.toLowerCase() === "french") {
          extraCandidates.push("fra", "français", "francais", "frnch");
        } else if (lang.name.toLowerCase() === "chinese") {
          extraCandidates.push("chn", "zhongwen", "cnese");
        } else if (lang.name.toLowerCase() === "japanese") {
          extraCandidates.push("jpn", "nihongo", "japnese");
        } else if (lang.name.toLowerCase() === "korean") {
          extraCandidates.push("kor", "hanguk", "hangugeo", "koren");
        } else if (lang.name.toLowerCase() === "russian") {
          extraCandidates.push("rus", "russkiy", "russki");
        }
        
        return [...standardCandidates, ...extraCandidates];
      },
      (lang) => lang.iso639_1
    );
  } else {
    processCandidates<LanguageData>(
      languages,
      "language",
      (lang) => {
        // Start with standard candidates
        const standardCandidates = [
          lang.iso639_1.toLowerCase(),
          lang.iso639_2.toLowerCase(),
          lang.iso639_3.toLowerCase(),
          lang.name.toLowerCase(),
          ...(lang.native ? [lang.native.toLowerCase()] : []),
          ...lang.aliases.map((a) => a.toLowerCase()),
        ];
        
        // Add language-specific variations for common languages
        const extraCandidates = [];
        
        if (lang.name.toLowerCase() === "english") {
          extraCandidates.push("eng", "english language", "englsh");
        } else if (lang.name.toLowerCase() === "spanish") {
          extraCandidates.push("esp", "espanol", "español", "spansh");
        } else if (lang.name.toLowerCase() === "german") {
          extraCandidates.push("deu", "deutsch", "germn", "germa", "grmn");
        } else if (lang.name.toLowerCase() === "french") {
          extraCandidates.push("fra", "français", "francais", "frnch");
        } else if (lang.name.toLowerCase() === "chinese") {
          extraCandidates.push("chn", "zhongwen", "cnese");
        } else if (lang.name.toLowerCase() === "japanese") {
          extraCandidates.push("jpn", "nihongo", "japnese");
        } else if (lang.name.toLowerCase() === "korean") {
          extraCandidates.push("kor", "hanguk", "hangugeo", "koren");
        } else if (lang.name.toLowerCase() === "russian") {
          extraCandidates.push("rus", "russkiy", "russki");
        }
        
        return [...standardCandidates, ...extraCandidates];
      },
      (lang) => lang.iso639_1
    );
    processCandidates<RegionData>(
      regions,
      "region",
      (region) => [
        region.alpha2.toLowerCase(),
        ...(region.alpha3 ? [region.alpha3.toLowerCase()] : []),
        ...(region.numeric ? [region.numeric] : []),
        region.name.toLowerCase(),
        ...region.aliases.map((a) => a.toLowerCase()),
        ...(region.name.toLowerCase().includes("united")
          ? [
              region.name.toLowerCase().replace("united", "").trim(),
              // Add common typos for "united"
              region.name.toLowerCase().replace("united", "unted").trim(),
              region.name.toLowerCase().replace("united", "untied").trim(),
              region.name.toLowerCase().replace("united", "uinted").trim()
            ]
          : []),
        ...(region.name.toLowerCase() === "united kingdom"
          ? ["england", "britain", "great britain"]
          : []),
        ...(region.name.toLowerCase() === "united states"
          ? ["america", "usa", "us of a", "unted states", "untied states", "uinted states"]
          : [])
      ],
      (region) => region.alpha2
    );
  }

  // If we haven't already processed scripts, do it now
  if (!mightBeScript) {
    processCandidates<ScriptData>(
      scripts,
      "script",
      (script) => [
        script.code,
        script.name.toLowerCase(),
        ...(script.name.includes(' script') ? [script.name.replace(' script', '')] : []),
        ...(script.name.includes(' alphabet') ? [script.name.replace(' alphabet', '')] : []),
        ...script.aliases
      ],
      (script) => script.code
    );
  }

  // Final sort by distance, then rank, then code
  const sorted = matches
    .sort((a, b) => {
      // Primary sort by distance
      const distanceDiff = a.distance - b.distance;
      if (distanceDiff !== 0) return distanceDiff;

      // For equal distances, prioritize common regions/languages
      if (a.type === "region" && b.type === "region") {
        const aIsCommon = ["US", "GB", "CA", "AU"].includes(a.code);
        const bIsCommon = ["US", "GB", "CA", "AU"].includes(b.code);
        if (aIsCommon !== bIsCommon) return aIsCommon ? -1 : 1;
      }

      // Then by rank
      const rankDiff = a.rank - b.rank;
      if (rankDiff !== 0) return rankDiff;

      // Finally by code
      return a.code.localeCompare(b.code);
    });

  // Deduplicate by (code, type), keep only first
  const deduped: FuzzyMatch[] = [];
  for (const match of sorted) {
    const last = deduped[deduped.length - 1];
    if (!last || last.code !== match.code || last.type !== match.type) {
      deduped.push(match);
    }
  }

  // Return top 5
  return deduped.slice(0, 5);
}
