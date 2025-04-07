import { describe, test, expect } from 'vitest';
import { createValidator } from '../../src/core/validator';
import { loadGroup, preloadGroup } from '../../src/core/loader';

describe('Validator Integration Flow', () => {
  describe('Real-World Language Selection', () => {
    test('should handle common language selection scenarios', async () => {
      const europeanLangs = await loadGroup('european');
      const validator = createValidator()
        .withLanguages(europeanLangs)
        .withOptions({ mode: 'fuzzy' });

      // Test various real user inputs
      const tests = [
        { input: 'english', expected: 'en' },
        { input: 'eng_uk', expected: 'en-GB' },
        { input: 'spanish', expected: 'es' },
        { input: 'french', expected: 'fr' },
        { input: 'deutsch', expected: 'de' },
      ];

      for (const { input, expected } of tests) {
        const result = validator.validate(input);
        expect(result.suggestions).toContain(expected);
      }
    });
  });

  describe('Chinese Script Variants', () => {
    test('should handle Chinese script variations', async () => {
      const validator = createValidator()
        .withLanguages(['zh'])
        .withRegions(['CN', 'HK', 'TW'])
        .withScripts(['Hans', 'Hant'])
        .withOptions({ mode: 'fuzzy' });

      // Test various Chinese script scenarios
      const tests = [
        { input: 'chinese simplified', expected: 'zh-Hans' },
        { input: 'chinese traditional', expected: 'zh-Hant' },
        { input: 'chinese_hongkong', expected: 'zh-Hant-HK' },
        { input: 'chinese_taiwan', expected: 'zh-Hant-TW' },
        { input: 'mandarin', expected: 'zh' },
      ];

      for (const { input, expected } of tests) {
        const result = validator.validate(input);
        expect(result.suggestions).toContain(expected);
      }
    });
  });

  describe('API Integration', () => {
    test('should handle Accept-Language header values', async () => {
      const validator = createValidator()
        .withOptions({
          mode: 'strict',
          type: 'bcp47'
        });

      const headers = [
        'en-US,en;q=0.9',
        'fr-FR,fr;q=0.8,en-US;q=0.6',
        'de-DE,de;q=0.9,en;q=0.8',
        'zh-TW,zh;q=0.9,en-US;q=0.8',
      ];

      for (const header of headers) {
        const primary = header.split(',')[0];
        const result = validator.validate(primary);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('Form Validation', () => {
    test('should validate form inputs with feedback', async () => {
      const validator = createValidator()
        .withOptions({
          mode: 'fuzzy',
          suggestions: true
        });

      const formInputs = [
        { value: 'eng', expected: { isValid: true, normalized: 'en' } },
        { value: 'us', expected: { isValid: true, normalized: 'en-US' } },
        { value: 'chinese_traditional', expected: { isValid: true, normalized: 'zh-Hant' } },
        { value: 'invalid_lang', expected: { isValid: false, suggestions: expect.any(Array) } },
      ];

      for (const { value, expected } of formInputs) {
        const result = validator.validate(value);
        if (expected.isValid) {
          expect(result.isValid).toBe(true);
          expect(result.normalized).toBe(expected.normalized);
        } else {
          expect(result.isValid).toBe(false);
          expect(result.suggestions).toBeDefined();
        }
      }
    });
  });

  describe('Performance & Caching', () => {
    test('should handle bulk operations efficiently', async () => {
      const commonLangs = await loadGroup('common');
      const validator = createValidator()
        .withLanguages(commonLangs)
        .withOptions({
          mode: 'strict',
          cache: {
            strategy: 'memory',
            maxSize: 1000
          }
        });

      // Generate a large number of validation requests
      const requests = Array.from({ length: 1000 }, () => 'en-US');
      
      const startTime = performance.now();
      
      for (const req of requests) {
        const result = validator.validate(req);
        expect(result.isValid).toBe(true);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Ensure bulk operations complete in reasonable time
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Error Recovery', () => {
    test('should gracefully handle and recover from errors', async () => {
      const validator = createValidator()
        .withOptions({
          mode: 'fuzzy',
          suggestions: true
        });

      const errorCases = [
        { input: '', expected: { isValid: false } },
        { input: null, expected: { isValid: false } },
        { input: undefined, expected: { isValid: false } },
        { input: '123', expected: { isValid: false } },
        { input: 'en-', expected: { isValid: false, suggestions: ['en'] } },
        { input: '-US', expected: { isValid: false } },
      ];

      for (const { input, expected } of errorCases) {
        // @ts-expect-error testing invalid inputs
        const result = validator.validate(input);
        expect(result.isValid).toBe(expected.isValid);
        if (expected.suggestions) {
          expect(result.suggestions).toContain(expected.suggestions[0]);
        }
      }
    });
  });
}); 