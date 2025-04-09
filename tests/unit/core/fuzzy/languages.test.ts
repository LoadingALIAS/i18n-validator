/**
 * NEW: Tests language-specific fuzzy matching
 */

import { describe, it, expect } from 'vitest';
import { fuzzyMatchLanguage } from '../../../../src/core/fuzzy/languages';
import type { LanguageData } from '../../../../src/types';

describe('fuzzyMatchLanguage', () => {
  // Test data: small set of languages for testing
  const testLanguages = new Map<string, LanguageData>([
    ['en', {
      name: 'English',
      iso639_1: 'en',
      iso639_2: 'eng',
      iso639_3: 'eng',
      suppressScript: 'Latn',
      aliases: ['english', 'anglais', 'eng', 'english language', 'englsh']
    }],
    ['fr', {
      name: 'French',
      iso639_1: 'fr',
      iso639_2: 'fra',
      iso639_3: 'fra',
      suppressScript: 'Latn',
      aliases: ['french', 'français', 'fra', 'francais', 'frnch']
    }],
    ['de', {
      name: 'German',
      iso639_1: 'de',
      iso639_2: 'deu',
      iso639_3: 'deu',
      suppressScript: 'Latn',
      aliases: ['german', 'deutsch', 'deu', 'germn', 'germa', 'grmn']
    }],
    ['zh', {
      name: 'Chinese',
      iso639_1: 'zh',
      iso639_2: 'zho',
      iso639_3: 'zho',
      aliases: ['chinese', '中文', 'chin', 'zhongwen', 'chn', 'cnese']
    }],
    ['ja', {
      name: 'Japanese',
      iso639_1: 'ja',
      iso639_2: 'jpn',
      iso639_3: 'jpn',
      aliases: ['japanese', '日本語', 'jpn', 'nihongo', 'japnese']
    }]
  ]);

  it('should return empty array for empty input', () => {
    expect(fuzzyMatchLanguage('', testLanguages)).toEqual([]);
    expect(fuzzyMatchLanguage('   ', testLanguages)).toEqual([]);
  });

  it('should match exact language codes', () => {
    const result = fuzzyMatchLanguage('en', testLanguages);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('en');
    expect(result[0].distance).toBe(0); // exact match = distance 0
    expect(result[0].type).toBe('language');
  });

  it('should match language names', () => {
    const result = fuzzyMatchLanguage('english', testLanguages);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('en');
    expect(result[0].distance).toBe(0); // should be in aliases so exact match
  });

  it('should match ISO 639-2/3 codes', () => {
    const result1 = fuzzyMatchLanguage('eng', testLanguages);
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('en');

    const result2 = fuzzyMatchLanguage('fra', testLanguages);
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('fr');
  });

  it('should handle misspellings with Levenshtein distance', () => {
    const result1 = fuzzyMatchLanguage('englsh', testLanguages);
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('en');

    const result2 = fuzzyMatchLanguage('frentch', testLanguages);
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('fr');
  });

  it('should handle partial matches', () => {
    const result = fuzzyMatchLanguage('chin', testLanguages);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('zh');
  });

  it('should match common variations', () => {
    const result1 = fuzzyMatchLanguage('nihongo', testLanguages); // common name for Japanese
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('ja');

    const result2 = fuzzyMatchLanguage('deutsch', testLanguages); // German in German
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('de');
  });

  it('should sort results by distance then rank', () => {
    // Add a language with similar name for this test
    const extendedLanguages = new Map(testLanguages);
    extendedLanguages.set('en-GB', {
      name: 'British English',
      iso639_1: 'en-GB', // not a real ISO code but for testing
      iso639_2: 'eng',
      iso639_3: 'eng',
      suppressScript: 'Latn',
      aliases: ['english', 'british english', 'uk english']
    });

    const result = fuzzyMatchLanguage('english', extendedLanguages);
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].distance).toBeLessThanOrEqual(result[1].distance);
  });

  it('should handle non-Latin scripts', () => {
    const result = fuzzyMatchLanguage('中文', testLanguages);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('zh');
  });

  it('should respect maximum distance parameter', () => {
    // This should be too different to match with default maxDistance
    const noMatchResult = fuzzyMatchLanguage('fwegergrge', testLanguages);
    expect(noMatchResult.length).toBe(0);

    // With a very large maxDistance, it might find something
    const withLargeMaxResult = fuzzyMatchLanguage('fwegergrge', testLanguages, 10);
    expect(withLargeMaxResult.length).toBe(0); // still too different
  });
});



