/** Core types: LanguageData, RegionData, ScriptData, NormalizedResult */
export type LanguageData = {
  name: string;
  native: string;
  iso639_1: string;
  iso639_2: string;
  iso639_3: string;
  bcp47: string;
  region?: string;
  script?: string;
  suppressScript?: string;  // From IANA's Suppress-Script field
  scope?: 'macrolanguage' | 'collection' | 'special';  // From IANA's Scope field
  aliases: string[];
  added: string;  // IANA registry addition date
};

export type RegionData = {
  name: string;
  alpha2: string;
  alpha3: string;
  numeric: string;
  aliases: string[];
  added: string;  // IANA registry addition date
};

export type ScriptData = {
  name: string;
  code: string;  // 4-letter ISO 15924 code
  numeric: string;
  aliases: string[];
  added: string;  // IANA registry addition date
};

export type NormalizedResult<T> = T | null;

/** Validation feedback interface for combined validation results */
export interface ValidationFeedback {
  isValid: boolean;
  normalized?: string;    // e.g. "en-US"
  suggestions?: string[]; // if fuzzy logic suggests other codes
  helpText?: string;     // optional explanation
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

/** Cache options for performance optimization */
export interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
}
