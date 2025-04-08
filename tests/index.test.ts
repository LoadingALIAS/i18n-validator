/**
 * Basic smoke tests for main exports
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { configure, parse, suggest, validate } from '../src';

/**
 * Main test entry point for running via "pnpm test"
 * This file serves as a summary of key functionality and a quick sanity check
 */
describe('i18n-validator', () => {
  beforeAll(async () => {
    // Configure with test data
    await configure({
      languages: ['en', 'fr', 'de', 'es', 'zh'],
      regions: ['US', 'FR', 'DE', 'ES', 'CN'],
      scripts: ['Latn', 'Hans', 'Hant']
    });
  });

  describe('Core API Flow', () => {
    it('should validate valid inputs', () => {
      expect(validate('en')).toBe(true);
      expect(validate('en-US')).toBe(true);
      expect(validate('zh-Hans')).toBe(true);
    });

    it('should reject invalid inputs', () => {
      expect(validate('xx')).toBe(false);
      expect(validate('en-XX')).toBe(false);
      expect(validate('')).toBe(false);
    });

    it('should parse valid inputs and return details', () => {
      const result = parse('en-US');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('en-US');
      expect(result.details?.language?.code).toBe('en');
      expect(result.details?.region?.code).toBe('US');
    });

    it('should parse invalid inputs and provide suggestions', () => {
      const result = parse('english');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('en');
      
      const invalidResult = parse('xx');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.normalized).toBe(null);
      expect(invalidResult.suggestions.length).toBeGreaterThan(0);
    });

    it('should suggest similar valid codes', () => {
      const suggestions = suggest('eng');
      expect(suggestions).toContain('en');
      
      const regionSuggestions = suggest('united', { type: 'region' });
      expect(regionSuggestions).toContain('US');
    });

    it('should validate with different modes', () => {
      // Strict mode requires exact format
      expect(validate('EN-us', 'strict')).toBe(false);
      
      // Fuzzy mode allows for common variations
      expect(validate('english', 'fuzzy')).toBe(true);
      
      // Loaded mode only checks component existence
      expect(validate('en', 'loaded')).toBe(true);
      expect(validate('ja', 'loaded')).toBe(false); // Not loaded in our test setup
    });
  });
});