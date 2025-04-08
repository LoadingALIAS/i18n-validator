/**
 * EXTRACTED: Levenshtein implementation from 'matcher.ts'
 */

import { describe, it, expect } from 'vitest';
import { levenshteinDistance } from '../../../../src/core/fuzzy/levenshtein';

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('kitten', 'kitten', 10)).toBe(0);
    expect(levenshteinDistance('', '', 10)).toBe(0);
    expect(levenshteinDistance('a', 'a', 10)).toBe(0);
  });

  it('should return the correct distance for simple cases', () => {
    expect(levenshteinDistance('kitten', 'sitting', 10)).toBe(3);
    expect(levenshteinDistance('saturday', 'sunday', 10)).toBe(3);
    expect(levenshteinDistance('book', 'back', 10)).toBe(2);
  });

  it('should handle empty strings correctly', () => {
    expect(levenshteinDistance('', 'a', 10)).toBe(1);
    expect(levenshteinDistance('a', '', 10)).toBe(1);
    expect(levenshteinDistance('', 'abc', 10)).toBe(3);
  });

  it('should respect the maxDistance parameter', () => {
    expect(levenshteinDistance('kitten', 'sitting', 2)).toBe(Number.POSITIVE_INFINITY);
    expect(levenshteinDistance('kitten', 'sitting', 3)).toBe(3);
    expect(levenshteinDistance('book', 'back', 1)).toBe(Number.POSITIVE_INFINITY);
    expect(levenshteinDistance('book', 'back', 2)).toBe(2);
  });

  it('should handle case differences', () => {
    expect(levenshteinDistance('KITTEN', 'kitten', 10)).toBe(6); // Every character is different
    expect(levenshteinDistance('Book', 'book', 10)).toBe(1);
  });

  it('should handle strings of different lengths efficiently', () => {
    // The actual distance is larger than the maxDistance (10), so it returns Infinity
    expect(levenshteinDistance('short', 'very long string', 10)).toBe(Number.POSITIVE_INFINITY);
    expect(levenshteinDistance('very long string', 'short', 10)).toBe(Number.POSITIVE_INFINITY);
    
    // For a valid test case with different lengths
    expect(levenshteinDistance('abc', 'abcdef', 10)).toBe(3);
    expect(levenshteinDistance('abcdef', 'abc', 10)).toBe(3);
  });

  it('should handle non-Latin characters', () => {
    expect(levenshteinDistance('你好', '你好啊', 10)).toBe(1);
    expect(levenshteinDistance('こんにちは', 'こんばんは', 10)).toBe(2);
  });

  it('should perform early termination correctly', () => {
    // When maxDistance is small, algorithm should terminate early for efficiency
    expect(levenshteinDistance('completely different', 'not even close', 5)).toBe(Number.POSITIVE_INFINITY);
    expect(levenshteinDistance('almost same', 'almst same', 1)).toBe(1);
    
    // Adjusted test case - the actual distance is 4 (o->d, s->i, a->f, m->f), not 3
    expect(levenshteinDistance('almost same', 'almost diff', 4)).toBe(4);
  });
});



