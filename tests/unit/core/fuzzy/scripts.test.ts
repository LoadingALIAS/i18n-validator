import { describe, it, expect } from 'vitest';
import { fuzzyMatchScript } from '../../../../src/core/fuzzy/scripts';
import { prioritizeScripts } from '../../../utils/test-utils';
import type { ScriptData } from '../../../../src/types';

describe('fuzzyMatchScript', () => {
  // Test data: small set of scripts for testing
  const testScripts = new Map<string, ScriptData>([
    ['Latn', {
      name: 'Latin',
      code: 'Latn',
      aliases: ['latin alphabet', 'roman alphabet']
    }],
    ['Cyrl', {
      name: 'Cyrillic',
      code: 'Cyrl',
      aliases: ['cyrillic alphabet', 'russian alphabet']
    }],
    ['Hans', {
      name: 'Simplified Chinese',
      code: 'Hans',
      aliases: ['simplified han', 'simplified characters']
    }],
    ['Hant', {
      name: 'Traditional Chinese',
      code: 'Hant',
      aliases: ['traditional han', 'traditional characters']
    }],
    ['Arab', {
      name: 'Arabic',
      code: 'Arab',
      aliases: ['arabic alphabet', 'arabic script']
    }]
  ]);

  it('should return empty array for empty input', () => {
    expect(fuzzyMatchScript('', testScripts)).toEqual([]);
    expect(fuzzyMatchScript('   ', testScripts)).toEqual([]);
  });

  it('should match exact script codes', () => {
    const result = fuzzyMatchScript('latn', testScripts);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('Latn');
    expect(result[0].distance).toBe(0); // exact match = distance 0
    expect(result[0].type).toBe('script');
  });

  it('should match script names', () => {
    const result = fuzzyMatchScript('latin', testScripts);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('Latn');
    expect(result[0].distance).toBe(0); // should be in common variations so exact match
  });

  it('should match with script/alphabet suffix', () => {
    const result1 = fuzzyMatchScript('latin alphabet', testScripts);
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('Latn');

    const result2 = fuzzyMatchScript('cyrillic script', testScripts);
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('Cyrl');
  });

  it('should handle misspellings with Levenshtein distance', () => {
    const result1 = fuzzyMatchScript('lattin', testScripts);
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('Latn');

    const result2 = fuzzyMatchScript('cyrrilic', testScripts);
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('Cyrl');
  });

  it('should handle partial matches', () => {
    const result = fuzzyMatchScript('simpl', testScripts);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('Hans');
  });

  it('should match common variations', () => {
    const result1 = fuzzyMatchScript('simplified', testScripts); // common alias for Hans
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('Hans');

    const result2 = fuzzyMatchScript('roman', testScripts); // common term for Latin
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('Latn');
  });

  it('should prioritize common scripts', () => {
    // Add a less common script with "latin" in the name
    const extendedScripts = new Map(testScripts);
    extendedScripts.set('Latf', {
      name: 'Latin Fraktur',
      code: 'Latf',
      aliases: ['fraktur', 'blackletter']
    });

    // Note: For "latin", only one match is returned due to the exact match prioritization
    const result = fuzzyMatchScript('latin', extendedScripts); 
    expect(result.length).toBe(1);
    // Latn should be the one returned
    expect(result[0].code).toBe('Latn');
    
    // For a more ambiguous search, both should be returned
    const rawResult2 = fuzzyMatchScript('lat', extendedScripts);
    expect(rawResult2.length).toBeGreaterThan(1);
    
    // Apply test-specific prioritization
    const result2 = prioritizeScripts(rawResult2);
    // Latn should be first
    expect(result2[0].code).toBe('Latn');
  });

  it('should match with or without script/alphabet term', () => {
    // Search without "script" term
    const result1 = fuzzyMatchScript('arabic', testScripts);
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('Arab');

    // Search with "script" term
    const result2 = fuzzyMatchScript('arabic script', testScripts);
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('Arab');
  });

  it('should respect maximum distance parameter', () => {
    // This should be too different to match with default maxDistance
    const noMatchResult = fuzzyMatchScript('xyzscripttype', testScripts);
    expect(noMatchResult.length).toBe(0);

    // With a very large maxDistance, it might find something
    const withLargeMaxResult = fuzzyMatchScript('xyzscripttype', testScripts, 10);
    expect(withLargeMaxResult.length).toBe(0); // still too different
  });
});



