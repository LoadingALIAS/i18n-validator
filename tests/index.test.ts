import { describe, it, expect } from 'vitest';
import { normalizeLanguageCode, isValidLanguageCode, normalizeRegionCode } from '../src';

/**
 * Main test entry point for running via "pnpm test"
 * This file serves as a summary of key functionality and a quick sanity check
 */
describe('i18n-validator', () => {
  describe('Core functionality', () => {
    it('should normalize language codes', () => {
      const result = normalizeLanguageCode('en');
      expect(result).toBeTruthy();
      if (result) {
        expect(result.iso639_1).toBe('en');
      }
    });

    it('should validate language codes', () => {
      expect(isValidLanguageCode('en')).toBe(true);
      expect(isValidLanguageCode('xx')).toBe(false);
    });

    it('should normalize region codes', () => {
      const result = normalizeRegionCode('US');
      expect(result).toBeTruthy();
      if (result) {
        expect(result.alpha2).toBe('US');
      }
    });
  });

  describe('Input handling', () => {
    it('should handle various formats of valid inputs', () => {
      expect(isValidLanguageCode('en')).toBe(true);
      expect(isValidLanguageCode('EN')).toBe(true);
      expect(isValidLanguageCode('eN')).toBe(true);
    });

    it('should reject invalid inputs', () => {
      expect(isValidLanguageCode('')).toBe(false);
      expect(isValidLanguageCode('xyz')).toBe(false);
      expect(isValidLanguageCode('1234')).toBe(false);
    });
  });
}); 