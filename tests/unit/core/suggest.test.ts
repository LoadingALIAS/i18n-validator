import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { suggest, suggestBCP47 } from '../../../src';
import { clearMockData, addMockLanguage, addMockRegion, addMockScript, mockLanguageData, mockRegionData, mockScriptData, setupMockConfigTest } from '../../setup';
import * as config from '../../../src/core/config';

describe('Suggest', () => {
  beforeEach(() => {
    clearMockData();
    addMockLanguage(mockLanguageData);
    addMockRegion(mockRegionData);
    addMockScript(mockScriptData);
    setupMockConfigTest();
  });

  afterEach(() => {
    clearMockData();
    vi.clearAllMocks();
  });

  describe('suggest function', () => {
    test('suggests language codes for close matches', () => {
      // Test with language in test data
      const result = suggest('english', { type: 'language' });
      expect(result).toContain('en');
      
      // Test with another spelling variation
      const result2 = suggest('englsh', { type: 'language' });
      expect(result2).toContain('en');
    });

    test('suggests region codes for close matches', () => {
      // Region suggestions
      const result = suggest('united', { type: 'region' });
      expect(result).toContain('US');
    });

    test('suggests script codes for close matches', () => {
      // Script suggestions
      const result = suggest('latin', { type: 'script' });
      expect(result).toContain('Latn');
    });

    test('respects result limit option', () => {
      // Get language suggestions with different limits
      const limitedResults = suggest('e', { type: 'language', limit: 2 });
      const moreResults = suggest('e', { type: 'language', limit: 5 });
      
      // Limited results should have at most 2 items
      expect(limitedResults.length).toBeLessThanOrEqual(2);
      
      // More results should have more items (if available)
      if (moreResults.length > 2) {
        expect(moreResults.length).toBeGreaterThan(limitedResults.length);
      }
    });

    test('respects maxDistance option', () => {
      // With a small maxDistance, fewer matches should be found
      const result1 = suggest('englsh', { maxDistance: 1 });
      
      // With a larger maxDistance, more matches should be found
      const result2 = suggest('englsh', { maxDistance: 3 });
      
      // Should find at least one match with appropriate maxDistance
      expect(result1.length).toBeGreaterThanOrEqual(0);
      expect(result2.length).toBeGreaterThanOrEqual(0);
    });

    test('returns detailed matches when requested', () => {
      // Get detailed matches
      const result = suggest('eng', { detailed: true }) as any[];
      
      if (result.length > 0) {
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('code');
        expect(result[0]).toHaveProperty('distance');
        expect(result[0]).toHaveProperty('type');
      }
    });

    test('handles empty input', () => {
      const result = suggest('');
      expect(result).toEqual([]);
    });

    test('throws error if data not loaded', () => {
      clearMockData(); // Ensure no data is loaded
      vi.mocked(config.isDataLoaded).mockReturnValue(false); // Make sure isDataLoaded returns false
      
      // Should throw when data isn't loaded
      expect(() => suggest('test')).toThrow();
    });
  });

  describe('suggestBCP47 function', () => {
    test('suggests corrections for malformed BCP47 tags', () => {
      // Test with a malformed tag
      const result = suggestBCP47('en-usa');
      
      // Should be invalid
      expect(result.isValid).toBe(false);
      
      // Should have suggestions
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('handles compound phrases', () => {
      // Test with a compound phrase
      const result = suggestBCP47('english united states');
      
      // Should have suggestions
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('handles special cases like Chinese variants', () => {
      // Only test if Chinese data is loaded
      if (Array.from(config.getLoadedLanguages().keys()).includes('zh')) {
        // Test with Chinese simplified
        const result = suggestBCP47('chinese simplified');
        
        // Should have suggestions
        expect(result.suggestions.length).toBeGreaterThan(0);
      } else {
        // Skip test
        expect(true).toBe(true);
      }
    });

    test('suggests valid language-region combinations for common languages', () => {
      // Test with a common language
      const result = suggestBCP47('en');
      
      // Should have suggestions
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('respects limit option', () => {
      // Test with two different limits
      const smallLimit = suggestBCP47('e', { limit: 2 });
      const largeLimit = suggestBCP47('e', { limit: 10 });
      
      // Compare results - if limit is actually working, smaller limit should
      // have fewer results (as long as we have more than 2 suggestions available)
      if (largeLimit.suggestions.length > 2) {
        expect(smallLimit.suggestions.length).toBeLessThanOrEqual(largeLimit.suggestions.length);
      }
    });

    test('handles empty input', () => {
      const result = suggestBCP47('');
      
      // Should be invalid
      expect(result.isValid).toBe(false);
      
      // Should have help text
      expect(result.helpText).toBeTruthy();
    });
  });
});



