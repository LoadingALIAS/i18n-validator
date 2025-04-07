import { describe, test, expect } from 'vitest';
import { createValidator } from '../../src/core/validator';
import { dataLoader, loadGroup, preloadGroup } from '../../src/core/loader';

describe('Validator & Loader Integration', () => {
  describe('Dynamic Loading with Validation', () => {
    test('should dynamically load and validate languages', async () => {
      // Start with empty validator
      const validator = createValidator();
      
      // Load European languages
      const europeanLangs = await loadGroup('european');
      validator.withLanguages(europeanLangs);

      // Validate some European languages
      const results = [
        validator.validate('en'),
        validator.validate('fr'),
        validator.validate('de'),
      ];

      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });

    test('should handle script loading and validation', async () => {
      const validator = createValidator();
      
      // Load CJK scripts
      const cjkLangs = await loadGroup('cjk');
      validator
        .withLanguages(cjkLangs)
        .withScripts(['Hans', 'Hant', 'Jpan', 'Kore']);

      const results = [
        validator.validate('zh-Hans'),
        validator.validate('zh-Hant'),
        validator.validate('ja-Jpan'),
        validator.validate('ko-Kore'),
      ];

      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Preloading Groups', () => {
    test('should preload and validate common languages', async () => {
      // Preload common languages with data
      const commonData = await preloadGroup('common');
      
      const validator = createValidator()
        .withLanguages(Array.from(commonData.keys()))
        .withOptions({ mode: 'strict' });

      // Test some common language validations
      const tests = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko'];
      
      for (const lang of tests) {
        const result = validator.validate(lang);
        expect(result.isValid).toBe(true);
        expect(commonData.has(lang)).toBe(true);
      }
    });
  });

  describe('Cache Interaction', () => {
    test('should maintain separate caches correctly', async () => {
      const validator = createValidator()
        .withOptions({
          cache: {
            strategy: 'memory',
            maxSize: 100
          }
        });

      // Load some data
      await loadGroup('common');
      
      // First validation attempt
      const result1 = validator.validate('en-US');
      
      // Clear loader cache but keep validator cache
      dataLoader.clearCache();
      
      // Second validation should still work from validator cache
      const result2 = validator.validate('en-US');
      
      expect(result1).toEqual(result2);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing data gracefully', async () => {
      const validator = createValidator()
        .withOptions({ mode: 'strict' });

      // Try to validate before loading any data
      const result = validator.validate('en-US');
      expect(result.isValid).toBe(false);
      
      // Load data and try again
      const commonLangs = await loadGroup('common');
      validator.withLanguages(commonLangs);
      
      const resultAfterLoad = validator.validate('en-US');
      expect(resultAfterLoad.isValid).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle language fallbacks', async () => {
      // Load both common and European languages
      const [commonLangs, europeanLangs] = await Promise.all([
        loadGroup('common'),
        loadGroup('european')
      ]);

      const validator = createValidator()
        .withLanguages([...commonLangs, ...europeanLangs])
        .withOptions({ mode: 'fuzzy' });

      const tests = [
        { input: 'en-GB', fallback: 'en' },
        { input: 'fr-CA', fallback: 'fr' },
        { input: 'es-MX', fallback: 'es' },
      ];

      for (const { input, fallback } of tests) {
        const result = validator.validate(input);
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(input);
        
        // Test fallback
        const fallbackResult = validator.validate(fallback);
        expect(fallbackResult.isValid).toBe(true);
      }
    });

    test('should handle mixed script and region combinations', async () => {
      const validator = createValidator()
        .withLanguages(['zh'])
        .withRegions(['CN', 'HK', 'TW'])
        .withScripts(['Hans', 'Hant']);

      const combinations = [
        'zh-Hans-CN',
        'zh-Hant-HK',
        'zh-Hant-TW',
      ];

      for (const combo of combinations) {
        const result = validator.validate(combo);
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(combo);
      }
    });
  });
}); 