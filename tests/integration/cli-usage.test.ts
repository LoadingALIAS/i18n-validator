import { describe, test, expect } from 'vitest';
import { validateWithFeedback } from '../../src';
import type { ValidationFeedback } from '../../src/types';

describe('CLI Usage Scenarios', () => {
  describe('Basic CLI Validation', () => {
    test('validates single language code', () => {
      // Simulate CLI input: i18n-validator validate en
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

    test('validates language-region combination', () => {
      // Simulate CLI input: i18n-validator validate en-US
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

    test('validates full language-script-region tag', () => {
      // Simulate CLI input: i18n-validator validate zh-Hant-HK
      const result = validateWithFeedback('zh-Hant-HK');
      expect(result).toMatchObject({
        isValid: true,
        normalized: 'zh-Hant-HK',
        helpText: undefined,
        suggestions: undefined,
        details: {
          language: {
            code: 'zh',
            valid: true
          },
          script: {
            code: 'hant',
            valid: true
          },
          region: {
            code: 'hk',
            valid: true
          }
        }
      });
    });
  });

  describe('CLI Batch Processing', () => {
    test('processes multiple codes from input', () => {
      // Simulate CLI input: i18n-validator validate-batch en-US,es-ES,fr-FR
      const inputs = ['en-US', 'es-ES', 'fr-FR'];
      const results = inputs.map(input => validateWithFeedback(input));

      results.forEach((result, index) => {
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(inputs[index]);
      });
    });

    test('handles mixed valid and invalid inputs', () => {
      // Simulate CLI input: i18n-validator validate-batch en-US,invalid,fr-FR
      const inputs = ['en-US', 'invalid', 'fr-FR'];
      const results = inputs.map(input => validateWithFeedback(input));

      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
    });
  });

  describe('CLI Output Formatting', () => {
    test('formats successful validation output', () => {
      // Simulate CLI input: i18n-validator validate en-US --format json
      const result = validateWithFeedback('en-US');
      const output = formatCliOutput(result);

      expect(output).toEqual({
        status: 'success',
        code: 'en-US',
        details: {
          language: 'en',
          region: 'us',
          script: undefined
        }
      });
    });

    test('formats validation error output', () => {
      // Simulate CLI input: i18n-validator validate invalid --format json
      const result = validateWithFeedback('invalid');
      const output = formatCliOutput(result);

      expect(output).toEqual({
        status: 'error',
        input: 'invalid',
        error: result.helpText,
        suggestions: result.suggestions
      });
    });
  });

  describe('CLI Error Handling', () => {
    test('handles empty input gracefully', () => {
      // Simulate CLI input: i18n-validator validate ""
      const result = validateWithFeedback('');
      expect(result.isValid).toBe(false);
      expect(result.helpText).toBe('Input cannot be empty');
    });

    test('handles malformed input gracefully', () => {
      // Simulate CLI input: i18n-validator validate "en_US;q=0.9"
      const result = validateWithFeedback('en_US;q=0.9');
      expect(result.isValid).toBe(false);
      expect(result.helpText).toBeTruthy();
    });
  });
});

// Helper function to format CLI output
function formatCliOutput(result: ValidationFeedback): unknown {
  if (result.isValid) {
    return {
      status: 'success',
      code: result.normalized,
      details: {
        language: result.details?.language?.code,
        script: result.details?.script?.code,
        region: result.details?.region?.code
      }
    };
  }

  return {
    status: 'error',
    input: result.details?.language?.code || result.details?.region?.code || result.details?.script?.code,
    error: result.helpText,
    suggestions: result.suggestions
  };
} 