import type { LanguageData, RegionData, ScriptData, ValidationFeedback } from "../types";
import { I18nValidationError } from "./utils";
import { fuzzyMatch } from "./fuzzy/matcher";

export type ValidatorOptions = {
  mode?: 'strict' | 'fuzzy';
  type?: 'language' | 'region' | 'script' | 'bcp47';
  suggestions?: boolean;
  cache?: {
    strategy?: 'memory' | 'lru';
    maxSize?: number;
    ttl?: number;
  };
};

export type ValidatorConfig = {
  languages?: string[];
  regions?: string[];
  scripts?: string[];
  options?: ValidatorOptions;
};

export class Validator {
  private languages: Set<string>;
  private regions: Set<string>;
  private scripts: Set<string>;
  private options: Required<ValidatorOptions>;
  private cache: Map<string, ValidationFeedback>;

  constructor(config?: ValidatorConfig) {
    this.languages = new Set(config?.languages);
    this.regions = new Set(config?.regions);
    this.scripts = new Set(config?.scripts);
    this.options = {
      mode: config?.options?.mode || 'strict',
      type: config?.options?.type || 'bcp47',
      suggestions: config?.options?.suggestions ?? true,
      cache: {
        strategy: config?.options?.cache?.strategy || 'memory',
        maxSize: config?.options?.cache?.maxSize || 1000,
        ttl: config?.options?.cache?.ttl || 3600000, // 1 hour
      },
    };
    this.cache = new Map();
  }

  // Builder pattern methods
  withLanguages(codes: string[]): this {
    this.languages = new Set(codes);
    return this;
  }

  withRegions(codes: string[]): this {
    this.regions = new Set(codes);
    return this;
  }

  withScripts(codes: string[]): this {
    this.scripts = new Set(codes);
    return this;
  }

  withOptions(options: ValidatorOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  // Core validation method
  validate(input: string): ValidationFeedback {
    if (input == null) {
      return {
        isValid: false,
        helpText: 'Input cannot be null',
        suggestions: []
      };
    }

    // Check cache first
    const cached = this.cache.get(input);
    if (cached) return cached;

    // Perform validation based on type and mode
    let result: ValidationFeedback;
    try {
      switch (this.options.type) {
        case 'language':
          result = this.validateLanguage(input);
          break;
        case 'region':
          result = this.validateRegion(input);
          break;
        case 'script':
          result = this.validateScript(input);
          break;
        case 'bcp47':
        default:
          result = this.validateBCP47(input);
      }

      // Cache result if valid
      if (result.isValid) {
        this.cache.set(input, result);
      }

      return result;
    } catch (error) {
      if (error instanceof I18nValidationError) {
        return {
          isValid: false,
          helpText: error.message,
          suggestions: this.options.suggestions ? this.getSuggestions(input) : undefined
        };
      }
      throw error;
    }
  }

  // Implementation methods (to be implemented)
  private validateLanguage(input: string): ValidationFeedback {
    if (!input) {
      throw new I18nValidationError('Language code cannot be empty');
    }

    const normalized = input.toLowerCase();
    const isValid = this.languages.has(normalized);

    return {
      isValid,
      normalized: isValid ? normalized : undefined,
      suggestions: !isValid && this.options.suggestions ? this.getSuggestions(input) : undefined,
      details: {
        language: {
          code: normalized,
          valid: isValid
        }
      }
    };
  }

  private validateRegion(input: string): ValidationFeedback {
    if (!input) {
      throw new I18nValidationError('Region code cannot be empty');
    }

    const normalized = input.toUpperCase();
    const isValid = this.regions.has(normalized);

    return {
      isValid,
      normalized: isValid ? normalized : undefined,
      suggestions: !isValid && this.options.suggestions ? this.getSuggestions(input) : undefined,
      details: {
        region: {
          code: normalized,
          valid: isValid
        }
      }
    };
  }

  private validateScript(input: string): ValidationFeedback {
    if (!input) {
      throw new I18nValidationError('Script code cannot be empty');
    }

    // Script codes are title case (e.g., 'Latn', 'Hans')
    const normalized = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    const isValid = this.scripts.has(normalized);

    return {
      isValid,
      normalized: isValid ? normalized : undefined,
      suggestions: !isValid && this.options.suggestions ? this.getSuggestions(input) : undefined,
      details: {
        script: {
          code: normalized,
          valid: isValid
        }
      }
    };
  }

  private validateBCP47(input: string): ValidationFeedback {
    if (!input) {
      throw new I18nValidationError('BCP47 tag cannot be empty');
    }

    const parts = input.split('-');
    const language = parts[0]?.toLowerCase();
    const script = parts.find(p => p.length === 4 && /^[A-Z][a-z]{3}$/.test(p));
    const region = parts.find(p => p.length === 2 && /^[A-Z]{2}$/.test(p));

    // Validate each component
    const langValid = this.languages.has(language);
    const scriptValid = script ? this.scripts.has(script) : true;
    const regionValid = region ? this.regions.has(region) : true;

    const isValid = langValid && scriptValid && regionValid;

    // Build normalized tag
    let normalized = language;
    if (script) normalized += `-${script}`;
    if (region) normalized += `-${region}`;

    return {
      isValid,
      normalized: isValid ? normalized : undefined,
      suggestions: !isValid && this.options.suggestions ? this.getSuggestions(input) : undefined,
      details: {
        language: {
          code: language,
          valid: langValid
        },
        script: script ? {
          code: script,
          valid: scriptValid
        } : undefined,
        region: region ? {
          code: region,
          valid: regionValid
        } : undefined
      }
    };
  }

  private getSuggestions(input: string): string[] {
    if (input == null) return [];
    
    const matches = fuzzyMatch(input);
    
    // Filter matches based on validation type
    switch (this.options.type) {
      case 'language':
        return matches
          .filter(m => m.type === 'language')
          .map(m => m.code);
      
      case 'region':
        return matches
          .filter(m => m.type === 'region')
          .map(m => m.code);
      
      case 'script':
        return matches
          .filter(m => m.type === 'script')
          .map(m => m.code);
      
      case 'bcp47':
        // For BCP47, try to match parts
        const parts = input.toLowerCase().split(/[-_]/);
        const langPart = parts[0];
        
        const langMatches = fuzzyMatch(langPart)
          .filter(m => m.type === 'language')
          .map(m => m.code);
        
        if (parts.length === 1) {
          return langMatches;
        }
        
        // If we have more parts, try to match them as region/script
        const suggestions: string[] = [];
        for (const lang of langMatches) {
          suggestions.push(lang); // Add just the language
          
          // Add combinations with regions/scripts based on the second part
          const part2Matches = fuzzyMatch(parts[1]);
          for (const match of part2Matches) {
            if (match.type === 'region') {
              suggestions.push(`${lang}-${match.code}`);
            } else if (match.type === 'script') {
              suggestions.push(`${lang}-${match.code}`);
            }
          }
        }
        
        return suggestions.slice(0, 5); // Limit to top 5
    }
    
    return [];
  }
}

// Factory function for creating validators
export function createValidator(config?: ValidatorConfig): Validator {
  return new Validator(config);
}

// Default validator instance with common settings
export const defaultValidator = new Validator({
  languages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko'],
  regions: ['US', 'GB', 'ES', 'FR', 'DE', 'CN', 'JP', 'KR'],
  scripts: ['Latn', 'Hans', 'Hant', 'Jpan', 'Kore'],
  options: {
    mode: 'fuzzy',
    type: 'bcp47',
    suggestions: true,
  }
}); 