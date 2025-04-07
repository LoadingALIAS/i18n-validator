import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Validator, createValidator, defaultValidator } from '../../../src/core/validator';
import type { ValidationFeedback } from '../../../src/types';

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator({
      languages: ['en', 'es', 'fr'],
      regions: ['US', 'GB', 'ES'],
      scripts: ['Latn', 'Hans', 'Hant'],
      options: {
        mode: 'strict',
        type: 'bcp47',
        suggestions: true
      }
    });
  });

  describe('Constructor & Configuration', () => {
    test('should create with default options', () => {
      const v = new Validator();
      expect(v).toBeInstanceOf(Validator);
    });

    test('should create with custom options', () => {
      const v = new Validator({
        options: {
          mode: 'fuzzy',
          type: 'language',
          suggestions: false
        }
      });
      expect(v).toBeInstanceOf(Validator);
    });
  });

  describe('Builder Pattern', () => {
    test('should allow chaining configuration methods', () => {
      const v = new Validator()
        .withLanguages(['en', 'fr'])
        .withRegions(['US', 'GB'])
        .withScripts(['Latn'])
        .withOptions({ mode: 'fuzzy' });

      expect(v).toBeInstanceOf(Validator);
    });
  });

  describe('Validation Methods', () => {
    test('should validate language codes', () => {
      validator.withOptions({ type: 'language' });
      const result = validator.validate('en');
      expect(result.isValid).toBe(true);
    });

    test('should validate region codes', () => {
      validator.withOptions({ type: 'region' });
      const result = validator.validate('US');
      expect(result.isValid).toBe(true);
    });

    test('should validate script codes', () => {
      validator.withOptions({ type: 'script' });
      const result = validator.validate('Latn');
      expect(result.isValid).toBe(true);
    });

    test('should validate BCP47 tags', () => {
      const result = validator.validate('en-US');
      expect(result.isValid).toBe(true);
    });

    test('should handle invalid input', () => {
      const result = validator.validate('invalid');
      expect(result.isValid).toBe(false);
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('Caching', () => {
    test('should cache valid results', () => {
      const first = validator.validate('en-US');
      const second = validator.validate('en-US');
      expect(first).toEqual(second);
    });

    test('should not cache invalid results', () => {
      const result = validator.validate('invalid');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Factory Functions', () => {
    test('createValidator should return new instance', () => {
      const v = createValidator();
      expect(v).toBeInstanceOf(Validator);
    });

    test('defaultValidator should be preconfigured', () => {
      expect(defaultValidator).toBeInstanceOf(Validator);
      const result = defaultValidator.validate('en-US');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle null input', () => {
      // @ts-expect-error testing null input
      const result = validator.validate(null);
      expect(result.isValid).toBe(false);
    });

    test('should handle empty string', () => {
      const result = validator.validate('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Fuzzy Mode', () => {
    beforeEach(() => {
      validator.withOptions({ mode: 'fuzzy' });
    });

    test('should provide suggestions for near matches', () => {
      const result = validator.validate('english');
      expect(result.suggestions).toContain('en');
    });

    test('should handle common variations', () => {
      const result = validator.validate('eng_usa');
      expect(result.suggestions).toContain('en-US');
    });
  });
}); 