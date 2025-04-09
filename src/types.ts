/** Core types: LanguageData, RegionData, ScriptData, NormalizedResult */
export type LanguageData = {
  name: string;
  iso639_1: string;
  iso639_2: string;
  iso639_3: string;
  region?: string;
  script?: string;
  suppressScript?: string; // From IANA's Suppress-Script field
  scope?: "macrolanguage" | "collection" | "special"; // From IANA's Scope field
  aliases: string[]; // Includes native names and other variations
};

export type RegionData = {
  name: string;
  alpha2: string;
  alpha3: string;
  numeric: string;
  aliases: string[];
};

export type ScriptData = {
  name: string;
  code: string; // 4-letter ISO 15924 code
  aliases: string[];
};

export type NormalizedResult<T> = T | null;

/** Validation feedback interface for results of validation operations */
export interface ValidationFeedback {
  isValid: boolean;
  normalized: string | null; // null represents invalid result
  helpText: string; // explanation message
  suggestions: string[]; // fuzzy matches and suggestions
  details?: {
    language?: {
      code: string;
      valid: boolean;
      suppressScript?: string;
    };
    region?: {
      code: string;
      valid: boolean;
    };
    script?: {
      code: string;
      valid: boolean;
    };
  };
}

/** Fuzzy matching result interface */
export interface FuzzyMatch {
  code: string;
  distance: number;
  type: "language" | "region" | "script";
  data: LanguageData | RegionData | ScriptData;
  rank: number;
}
