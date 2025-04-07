import { normalizeLanguageCode } from "./languages/normalize";
import { normalizeRegionCode } from "./regions/normalize";
import { normalizeScriptCode } from "./scripts/validate";
import { fuzzyMatch } from "./fuzzy/matcher";
import { ValidationCache } from "./cache";
import type { ValidationFeedback } from "../types";

// Create a cache for validation results
const validationCache = new ValidationCache<string, ValidationFeedback>();

/**
 * Splits a raw input string into potential language, script, and region parts.
 * Handles common separators like underscore, hyphen, and space.
 */
function splitInput(input: string): { language: string; script?: string; region?: string } {
  const normalized = input.trim().toLowerCase();
  const parts = normalized.split(/[-_\s]/);
  
  // Basic case: just language
  if (parts.length === 1) {
    return { language: parts[0] };
  }
  
  // Two-part case: either language-region or language-script
  if (parts.length === 2) {
    // If second part is 4 letters, it's likely a script
    if (parts[1].length === 4) {
      return { language: parts[0], script: parts[1] };
    }
    // Otherwise, assume it's a region
    return { language: parts[0], region: parts[1] };
  }
  
  // Three-part case: language-script-region
  if (parts.length >= 3) {
    return {
      language: parts[0],
      script: parts[1],
      region: parts[2]
    };
  }
  
  // Fallback
  return { language: parts[0] };
}

/**
 * Formats suggestions into BCP47-style strings
 */
function formatSuggestion(language: string, script?: string, region?: string): string {
  let result = language;
  if (script) {
    result += `-${script}`;
  }
  if (region) {
    result += `-${region}`;
  }
  return result;
}

type ValidatedDetails = Required<Pick<NonNullable<ValidationFeedback["details"]>, "language">> & 
  Omit<NonNullable<ValidationFeedback["details"]>, "language">;

/**
 * Validates and normalizes raw language/region/script input with detailed feedback.
 * Accepts formats like: "eng_US", "en-us", "english us", "zh-hans-hk", etc.
 */
export function validateWithFeedback(input: string): ValidationFeedback {
  // Check cache first
  const cached = validationCache.get(input);
  if (cached !== null) {
    return cached;
  }

  if (!input?.trim()) {
    return {
      isValid: false,
      helpText: "Input cannot be empty",
    };
  }

  const { language: rawLanguage, script: rawScript, region: rawRegion } = splitInput(input);
  const details: ValidatedDetails = {
    language: {
      code: rawLanguage,
      valid: false
    }
  };
  
  // Validate language
  const languageData = normalizeLanguageCode(rawLanguage);
  details.language.valid = !!languageData;
  
  // Set suppressScript if available
  if (languageData?.suppressScript) {
    details.language.suppressScript = languageData.suppressScript;
  }

  // Validate script if provided
  if (rawScript) {
    const normalizedScript = normalizeScriptCode(rawScript);
    details.script = {
      code: rawScript,
      valid: !!normalizedScript,
    };
  }

  // Validate region if provided
  if (rawRegion) {
    const regionData = normalizeRegionCode(rawRegion);
    details.region = {
      code: rawRegion,
      valid: !!regionData,
    };
  }

  // Determine overall validity and create normalized form
  const isValid = details.language.valid && 
                 (!details.script || details.script.valid) && 
                 (!details.region || details.region.valid);
  
  let normalized: string | undefined;
  if (isValid) {
    normalized = languageData!.iso639_1;
    
    // Add script if provided and valid
    if (details.script?.valid && rawScript) {
      const scriptCode = normalizeScriptCode(rawScript);
      if (scriptCode) {
        normalized += `-${scriptCode}`;
      }
    }
    
    // Add region if provided and valid
    if (details.region?.valid && rawRegion) {
      const regionData = normalizeRegionCode(rawRegion);
      if (regionData) {
        normalized += `-${regionData.alpha2}`;
      }
    }
  }

  // Generate help text and suggestions based on validation results
  let helpText: string | undefined;
  let suggestions: string[] | undefined;

  if (!isValid) {
    const issues: string[] = [];
    
    // Handle invalid language
    if (!details.language.valid) {
      issues.push("invalid language code");
      const langMatches = fuzzyMatch(rawLanguage).filter(m => m.type === "language");
      if (langMatches.length > 0) {
        const scriptValid = details.script?.valid && rawScript;
        const regionValid = details.region?.valid && rawRegion;
        
        suggestions = langMatches.map(m => {
          const normalizedScript = scriptValid ? normalizeScriptCode(rawScript) || undefined : undefined;
          const normalizedRegion = regionValid ? 
            (normalizeRegionCode(rawRegion)?.alpha2 || undefined) : undefined;
          
          return formatSuggestion(m.code, normalizedScript, normalizedRegion);
        });
      }
    }

    // Handle invalid script
    if (details.script && !details.script.valid && rawScript) {
      issues.push("invalid script code");
      const scriptMatches = fuzzyMatch(rawScript).filter(m => m.type === "script");
      if (scriptMatches.length > 0) {
        const baseLang = details.language.valid && languageData ? 
          languageData.iso639_1 : details.language.code;
        
        const regionValid = details.region?.valid && rawRegion;
        const normalizedRegion = regionValid ? 
          (normalizeRegionCode(rawRegion)?.alpha2 || undefined) : undefined;
        
        const scriptSuggestions = scriptMatches.map(m => 
          formatSuggestion(baseLang, m.code, normalizedRegion)
        );
        
        suggestions = suggestions ? [...suggestions, ...scriptSuggestions] : scriptSuggestions;
      }
    }

    // Handle invalid region
    if (details.region && !details.region.valid && rawRegion) {
      issues.push("invalid region code");
      const regionMatches = fuzzyMatch(rawRegion).filter(m => m.type === "region");
      if (regionMatches.length > 0) {
        const baseLang = details.language.valid && languageData ? 
          languageData.iso639_1 : details.language.code;
        
        const scriptValid = details.script?.valid && rawScript;
        const baseScript = scriptValid ? normalizeScriptCode(rawScript) || undefined : undefined;
        
        const regionSuggestions = regionMatches.map(m => 
          formatSuggestion(baseLang, baseScript, m.code)
        );
        
        // If we have a valid language but no region suggestions, try searching with "united" prefix
        if (details.language.valid && regionSuggestions.length === 0 && rawRegion.toLowerCase().includes("unit")) {
          const unitedMatches = fuzzyMatch("united " + rawRegion).filter(m => m.type === "region");
          const unitedSuggestions = unitedMatches.map(m => 
            formatSuggestion(baseLang, baseScript, m.code)
          );
          suggestions = suggestions ? [...suggestions, ...unitedSuggestions] : unitedSuggestions;
        } else {
          suggestions = suggestions ? [...suggestions, ...regionSuggestions] : regionSuggestions;
        }
      }
    }

    helpText = `Validation failed: ${issues.join(", ")}`;
    if (suggestions?.length) {
      helpText += `. Did you mean: ${suggestions.slice(0, 3).join(", ")}?`;
    }
  }

  const result = {
    isValid,
    normalized,
    helpText,
    suggestions,
    details,
  };
  
  // Cache the result
  validationCache.set(input, result);
  
  return result;
} 