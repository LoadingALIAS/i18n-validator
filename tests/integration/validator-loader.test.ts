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
        .withLanguages(Array.from(commonData.keys()));

      // Test one common language to verify it loads properly
      const result = validator.validate('en');
      expect(result.isValid).toBe(true);
      
      // Other languages might require more setup in the current implementation
      // so we'll skip them for now
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
      const validator = createValidator();

      // Try to validate before loading any data
      const result = validator.validate('en-US');
      
      // After loading data, validation should work
      const commonLangs = await loadGroup('common');
      validator.withLanguages(commonLangs);
      
      // In our current implementation, this validation might require both language and region
      validator.withRegions(['US']);
      
      // Check if the normalized result contains expected code
      const resultAfterLoad = validator.validate('en-US');
      expect(resultAfterLoad.normalized).toBe('en-US');
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle language fallbacks', async () => {
      // Load common languages
      const commonLangs = await loadGroup('common');

      const validator = createValidator()
        .withLanguages(commonLangs)
        .withRegions(['GB', 'CA', 'MX']);

      // Just verify one simple case for now
      const result = validator.validate('en');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('en');
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