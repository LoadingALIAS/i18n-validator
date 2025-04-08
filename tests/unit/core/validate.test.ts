/**
 * NEW: Tests validation logic
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { validate, validateBCP47, type ValidationType } from '../../../src';
import { clearMockData, addMockLanguage, addMockRegion, addMockScript, mockLanguageData, mockRegionData, mockScriptData } from '../../setup';

describe('Validate', () => {
  beforeEach(() => {
    clearMockData();
    addMockLanguage(mockLanguageData);
    addMockRegion(mockRegionData);
    addMockScript(mockScriptData);
  });

  describe('validate function', () => {
    test('validates correct inputs', () => {
      expect(validate('en')).toBe(true);
      expect(validate('en-US')).toBe(true);
      expect(validate('en-Latn')).toBe(true);
      expect(validate('en-Latn-US')).toBe(true);
    });

    test('rejects invalid inputs', () => {
      expect(validate('xx')).toBe(false);
      expect(validate('en-XX')).toBe(false);
      expect(validate('en-Xxxx')).toBe(false);
      expect(validate('')).toBe(false);
    });

    test('handles case variations', () => {
      expect(validate('EN')).toBe(true);
      expect(validate('en-us')).toBe(true);
      expect(validate('en-latn-US')).toBe(true);
    });

    test('respects validation mode', () => {
      const testCases: Array<[string, ValidationType, boolean]> = [
        ['english', 'strict', false], // Not in strict BCP47 format
        ['english', 'fuzzy', true],   // Should be accepted in fuzzy mode
        ['en', 'loaded', true],       // Available in loaded data
        ['jp', 'loaded', false],      // Not available in loaded data
      ];

      for (const [input, mode, expected] of testCases) {
        expect(validate(input, mode)).toBe(expected);
      }
    });
  });

  describe('validateBCP47 function', () => {
    test('provides detailed validation feedback for valid inputs', () => {
      const result = validateBCP47('en-US');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('en-US');
      expect(result.helpText).toBeTruthy();
    });

    test('provides detailed validation feedback for invalid inputs', () => {
      const result = validateBCP47('xx');
      expect(result.isValid).toBe(false);
      expect(result.normalized).toBe(null);
      expect(result.helpText).toBeTruthy();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('provides error for empty input', () => {
      const result = validateBCP47('');
      expect(result.isValid).toBe(false);
      expect(result.normalized).toBe(null);
      expect(result.helpText).toBe('Empty input');
    });

    test('provides different validation in different modes', () => {
      // Fuzzy mode should allow common variations
      const fuzzyResult = validateBCP47('english', 'fuzzy');
      expect(fuzzyResult.isValid).toBe(true);
      expect(fuzzyResult.normalized).toBe('en');

      // Strict mode requires proper format
      const strictResult = validateBCP47('english', 'strict');
      expect(strictResult.isValid).toBe(false);
      expect(strictResult.normalized).toBe(null);

      // Loaded mode only checks if components exist in loaded data
      const loadedResult = validateBCP47('en', 'loaded');
      expect(loadedResult.isValid).toBe(true);
      expect(loadedResult.normalized).toBe('en');
    });
  });
});



