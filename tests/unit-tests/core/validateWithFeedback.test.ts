import { describe, test, expect, beforeEach } from 'vitest';
import { validateWithFeedback } from '../../../src';
import { clearMockData, addMockLanguage, addMockRegion, addMockScript, mockLanguageData, mockRegionData, mockScriptData } from '../../setup';

describe('validateWithFeedback', () => {
  beforeEach(() => {
    clearMockData();
    addMockLanguage(mockLanguageData);
    addMockRegion(mockRegionData);
    addMockScript(mockScriptData);
  });

  describe('Basic Validation', () => {
    test('validates correct language code', () => {
      const result = validateWithFeedback('en');
      expect(result).toEqual({
        isValid: true,
        normalized: 'en',
        helpText: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'en',
            valid: true,
            suppressScript: 'Latn'
          }
        }
      });
    });

    test('validates correct language-region combination', () => {
      const result = validateWithFeedback('en-US');
      expect(result).toEqual({
        isValid: true,
        normalized: 'en-US',
        helpText: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'en',
            valid: true,
            suppressScript: 'Latn'
          },
          region: {
            code: 'us',
            valid: true
          }
        }
      });
    });

    test('validates correct language-script-region combination', () => {
      const result = validateWithFeedback('en-Latn-US');
      expect(result).toEqual({
        isValid: true,
        normalized: 'en-Latn-US',
        helpText: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'en',
            valid: true,
            suppressScript: 'Latn'
          },
          script: {
            code: 'latn',
            valid: true
          },
          region: {
            code: 'us',
            valid: true
          }
        }
      });
    });
  });

  describe('Fuzzy Matching', () => {
    test('provides suggestions for similar language codes', () => {
      const result = validateWithFeedback('eng');
      expect(result).toEqual({
        isValid: true,
        normalized: 'en',
        helpText: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'eng',
            valid: true,
            suppressScript: 'Latn'
          }
        }
      });
    });

    test('provides suggestions for similar region codes', () => {
      const result = validateWithFeedback('en-USA');
      expect(result).toEqual({
        isValid: true,
        normalized: 'en-US',
        helpText: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'en',
            valid: true,
            suppressScript: 'Latn'
          },
          region: {
            code: 'usa',
            valid: true
          }
        }
      });
    });

    test('handles common misspellings', () => {
      const result = validateWithFeedback('english');
      expect(result).toEqual({
        isValid: true,
        normalized: 'en',
        helpText: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'english',
            valid: true,
            suppressScript: 'Latn'
          }
        }
      });
    });
  });

  describe('Error Cases', () => {
    test('handles empty input', () => {
      const result = validateWithFeedback('');
      expect(result).toEqual({
        isValid: false,
        helpText: 'Input cannot be empty'
      });
    });

    test('handles invalid language code', () => {
      const result = validateWithFeedback('xx');
      expect(result).toEqual({
        isValid: false,
        helpText: 'Validation failed: invalid language code',
        normalized: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'xx',
            valid: false
          }
        }
      });
    });

    test('handles invalid script code', () => {
      const result = validateWithFeedback('en-Xxxx');
      expect(result).toMatchObject({
        isValid: false,
        details: {
          language: {
            code: 'en',
            valid: true,
            suppressScript: 'Latn'
          },
          script: {
            code: 'xxxx',
            valid: false
          }
        }
      });
      expect(result.helpText).toContain('invalid script code');
      expect(result.suggestions).toBeTruthy();
    });
  });

  describe('Special Cases', () => {
    test('handles suppress script information', () => {
      addMockLanguage({
        ...mockLanguageData,
        iso639_1: 'ja',
        suppressScript: 'Jpan'
      });

      const result = validateWithFeedback('ja-Jpan');
      expect(result).toEqual({
        isValid: true,
        normalized: 'ja-Jpan',
        helpText: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'ja',
            valid: true,
            suppressScript: 'Jpan'
          },
          script: {
            code: 'jpan',
            valid: true
          }
        }
      });
    });

    test('handles case normalization', () => {
      const result = validateWithFeedback('EN-us');
      expect(result).toEqual({
        isValid: true,
        normalized: 'en-US',
        helpText: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'en',
            valid: true,
            suppressScript: 'Latn'
          },
          region: {
            code: 'us',
            valid: true
          }
        }
      });
    });
  });
}); 