/**
 * NEW: Tests region-specific fuzzy matching
 */

import { describe, it, expect } from 'vitest';
import { fuzzyMatchRegion } from '../../../../src/core/fuzzy/regions';
import type { RegionData } from '../../../../src/types';

describe('fuzzyMatchRegion', () => {
  // Test data: small set of regions for testing
  const testRegions = new Map<string, RegionData>([
    ['US', {
      name: 'United States',
      alpha2: 'US',
      alpha3: 'USA',
      numeric: '840',
      aliases: ['usa', 'united states of america']
    }],
    ['GB', {
      name: 'United Kingdom',
      alpha2: 'GB',
      alpha3: 'GBR',
      numeric: '826',
      aliases: ['uk', 'great britain', 'britain']
    }],
    ['DE', {
      name: 'Germany',
      alpha2: 'DE',
      alpha3: 'DEU',
      numeric: '276',
      aliases: ['germany', 'deutschland']
    }],
    ['CN', {
      name: 'China',
      alpha2: 'CN',
      alpha3: 'CHN',
      numeric: '156',
      aliases: ['china', '中国']
    }],
    ['JP', {
      name: 'Japan',
      alpha2: 'JP',
      alpha3: 'JPN',
      numeric: '392',
      aliases: ['japan', '日本']
    }]
  ]);

  it('should return empty array for empty input', () => {
    expect(fuzzyMatchRegion('', testRegions)).toEqual([]);
    expect(fuzzyMatchRegion('   ', testRegions)).toEqual([]);
  });

  it('should match exact region codes', () => {
    const result = fuzzyMatchRegion('us', testRegions);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('US');
    expect(result[0].distance).toBe(0); // exact match = distance 0
    expect(result[0].type).toBe('region');
  });

  it('should match region names', () => {
    const result = fuzzyMatchRegion('united states', testRegions);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('US');
    expect(result[0].distance).toBe(0); // should be in common variations so exact match
  });

  it('should match ISO 3166-1 alpha-3 codes', () => {
    const result1 = fuzzyMatchRegion('usa', testRegions);
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('US');

    const result2 = fuzzyMatchRegion('gbr', testRegions);
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('GB');
  });

  it('should match numeric codes', () => {
    const result = fuzzyMatchRegion('840', testRegions);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('US');
    expect(result[0].distance).toBe(0); // exact match
  });

  it('should handle misspellings with Levenshtein distance', () => {
    const result1 = fuzzyMatchRegion('unted states', testRegions);
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('US');

    const result2 = fuzzyMatchRegion('germeny', testRegions);
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('DE');
  });

  it('should handle partial matches', () => {
    const result = fuzzyMatchRegion('states', testRegions);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('US');
  });

  it('should match common variations', () => {
    const result1 = fuzzyMatchRegion('uk', testRegions); // common alias for GB
    expect(result1.length).toBe(1);
    expect(result1[0].code).toBe('GB');

    const result2 = fuzzyMatchRegion('deutschland', testRegions); // German for Germany
    expect(result2.length).toBe(1);
    expect(result2[0].code).toBe('DE');
  });

  it('should prioritize common countries', () => {
    // Add a region with a name similar to 'United Kingdom' for this test
    const extendedRegions = new Map(testRegions);
    extendedRegions.set('AE', {
      name: 'United Arab Emirates',
      alpha2: 'AE',
      alpha3: 'ARE',
      numeric: '784',
      aliases: ['uae', 'emirates']
    });

    const result = fuzzyMatchRegion('united', extendedRegions);
    expect(result.length).toBeGreaterThan(1);
    // GB should be prioritized over AE
    expect(result[0].code).toBe('GB');
  });

  it('should handle non-Latin scripts', () => {
    const result = fuzzyMatchRegion('中国', testRegions);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('CN');
  });

  it('should respect maximum distance parameter', () => {
    // This should be too different to match with default maxDistance
    const noMatchResult = fuzzyMatchRegion('xyzdistantcountry', testRegions);
    expect(noMatchResult.length).toBe(0);

    // With a very large maxDistance, it might find something
    const withLargeMaxResult = fuzzyMatchRegion('xyzdistantcountry', testRegions, 10);
    expect(withLargeMaxResult.length).toBe(0); // still too different
  });
});



