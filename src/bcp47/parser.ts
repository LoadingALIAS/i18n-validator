import { normalizeLanguageCode } from "../core/languages/normalize";
import { normalizeRegionCode } from "../core/regions/normalize";
import { normalizeScriptCode } from "../core/scripts/validate";
import { fuzzyMatch } from "../core/fuzzy/matcher";
import type { LanguageData, RegionData, ScriptData, FuzzyMatch as GlobalFuzzyMatch } from "../types";

export interface ParsedBCP47 {
  language: string;
  script?: string;
  region?: string;
  raw: string;
}

// Use a type that matches the structure needed in this module
type ParserFuzzyMatch = GlobalFuzzyMatch & {
  type: "language" | "region" | "script";
};

export interface ParsedBCP47WithFeedback {
  parsed: ParsedBCP47 | null;
  suggestions: {
    language?: ParserFuzzyMatch[];
    region?: ParserFuzzyMatch[];
    script?: string[] | ParserFuzzyMatch[];
  };
  errors?: {
    language?: string;
    script?: string;
    region?: string;
  };
}

function titleCase(str: string): string {
  return str.length === 4
    ? str[0].toUpperCase() + str.slice(1).toLowerCase()
    : str;
}

// Common script names mapping
const commonScriptNames: Record<string, string> = {
  'traditional': 'Hant',
  'simplified': 'Hans',
  'latin': 'Latn',
  'cyrillic': 'Cyrl',
  // Add more common script names as needed
};

/**
 * Enhanced BCP 47 parser that provides detailed feedback and suggestions.
 * Supports all standard forms plus fuzzy matching:
 * - language (e.g., "en" or "english")
 * - language-region (e.g., "en-US" or "english_usa")
 * - language-script (e.g., "zh-Hant" or "chinese_traditional")
 * - language-script-region (e.g., "zh-Hant-HK" or "chinese_traditional_hongkong")
 */
export function parseBCP47WithFeedback(tag: string): ParsedBCP47WithFeedback {
  if (!tag) {
    return { 
      parsed: null,
      suggestions: {},
      errors: { language: 'Empty input' }
    };
  }

  // Store the original tag
  const originalTag = tag;

  // Normalize for parsing
  const normalized = tag.replace(/_/g, "-").trim().toLowerCase();
  const parts = normalized.split("-");

  const result: ParsedBCP47WithFeedback = {
    parsed: null,
    suggestions: {}
  };

  // Parse language (required)
  const [part1, part2, part3] = parts;
  const language = normalizeLanguageCode(part1);
  
  if (!language) {
    // Try fuzzy matching for language
    const langMatches = fuzzyMatch(part1, 2).filter(m => m.type === 'language') as ParserFuzzyMatch[];
    if (langMatches.length > 0) {
      result.suggestions.language = langMatches;
    }
    result.errors = { language: 'Invalid language code' };
    return result;
  }

  let script: string | undefined;
  let region: string | undefined;
  let hasErrors = false;

  // Handle two-part tags (language-script or language-region)
  if (part2) {
    if (part2.length === 4 || /^(traditional|simplified|latin|cyrillic)$/i.test(part2)) {
      // Try to parse as script
      const normalizedScript = normalizeScriptCode(part2);
      if (normalizedScript) {
        script = normalizedScript;
      } else {
        // For scripts, try fuzzy matching first
        const scriptMatches = fuzzyMatch(part2, 2).filter(m => m.type === 'script') as ParserFuzzyMatch[];
        if (scriptMatches.length > 0) {
          result.suggestions.script = scriptMatches;
        } 
        // Fall back to common names if no fuzzy matches found
        else {
          const commonName = commonScriptNames[part2.toLowerCase()];
          if (commonName) {
            result.suggestions.script = [commonName];
          }
        }
        result.errors = { ...result.errors, script: 'Invalid script code' };
        hasErrors = true;
      }
    } else {
      // Try to parse as region
      const regionData = normalizeRegionCode(part2);
      if (regionData) {
        region = regionData.alpha2;
      } else {
        // Try fuzzy matching for region
        const regionMatches = fuzzyMatch(part2, 2).filter(m => m.type === 'region') as ParserFuzzyMatch[];
        if (regionMatches.length > 0) {
          result.suggestions.region = regionMatches;
        }
        result.errors = { ...result.errors, region: 'Invalid region code' };
        hasErrors = true;
      }
    }
  }

  // Handle three-part tags (language-script-region)
  if (part3) {
    if (!script) {
      result.errors = { ...result.errors, script: 'Missing script code' };
      hasErrors = true;
    }
    
    const regionData = normalizeRegionCode(part3);
    if (regionData) {
      region = regionData.alpha2;
    } else {
      // Try fuzzy matching for region
      const regionMatches = fuzzyMatch(part3, 2).filter(m => m.type === 'region') as ParserFuzzyMatch[];
      if (regionMatches.length > 0) {
        result.suggestions.region = regionMatches;
      }
      result.errors = { ...result.errors, region: 'Invalid region code' };
      hasErrors = true;
    }
  }

  // Only set parsed if we have no errors
  if (!hasErrors) {
    result.parsed = {
      language: language.iso639_1,
      script,
      region,
      raw: originalTag,
    };
  }

  return result;
}

/**
 * Original parseBCP47 function, now implemented in terms of parseBCP47WithFeedback
 * Maintains backward compatibility
 */
export function parseBCP47(tag: string): ParsedBCP47 | null {
  const result = parseBCP47WithFeedback(tag);
  return result.parsed;
}
