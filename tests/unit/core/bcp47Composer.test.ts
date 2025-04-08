/**
 * NEW: Tests for the BCP47 composition logic
 */

import { describe, it, expect } from 'vitest';
import { composeBCP47 } from '../../../src/core/bcp47Composer';
import type { LanguageData, RegionData, ScriptData } from '../../../src/types';

describe('bcp47Composer', () => {
  // Mock data for testing
  const mockEnglish: LanguageData = {
    name: 'English',
    iso639_1: 'en',
    iso639_2: 'eng',
    iso639_3: 'eng',
    suppressScript: 'Latn', // English suppresses Latin script
    aliases: ['english']
  };

  const mockSpanish: LanguageData = {
    name: 'Spanish',
    iso639_1: 'es',
    iso639_2: 'spa',
    iso639_3: 'spa',
    suppressScript: 'Latn', // Spanish suppresses Latin script
    aliases: ['spanish', 'español']
  };

  const mockChinese: LanguageData = {
    name: 'Chinese',
    iso639_1: 'zh',
    iso639_2: 'zho',
    iso639_3: 'zho',
    // No suppressScript - Chinese requires explicit script
    aliases: ['chinese', '中文']
  };

  const mockLatin: ScriptData = {
    name: 'Latin',
    code: 'Latn',
    aliases: ['latin']
  };

  const mockSimplified: ScriptData = {
    name: 'Han (Simplified)',
    code: 'Hans',
    aliases: ['simplified chinese', 'simplified han']
  };

  const mockTraditional: ScriptData = {
    name: 'Han (Traditional)',
    code: 'Hant',
    aliases: ['traditional chinese', 'traditional han']
  };

  const mockUS: RegionData = {
    name: 'United States',
    alpha2: 'US',
    alpha3: 'USA',
    numeric: '840',
    aliases: ['united states', 'america', 'usa']
  };

  const mockSpain: RegionData = {
    name: 'Spain',
    alpha2: 'ES',
    alpha3: 'ESP',
    numeric: '724',
    aliases: ['spain', 'españa']
  };

  const mockChina: RegionData = {
    name: 'China',
    alpha2: 'CN',
    alpha3: 'CHN',
    numeric: '156',
    aliases: ['china', '中国']
  };

  const mockTaiwan: RegionData = {
    name: 'Taiwan',
    alpha2: 'TW',
    alpha3: 'TWN',
    numeric: '158',
    aliases: ['taiwan', '台湾']
  };

  it('should throw an error if language is not provided', () => {
    expect(() => composeBCP47(null as unknown as LanguageData)).toThrow();
  });

  it('should return simple language code when only language is provided', () => {
    expect(composeBCP47(mockEnglish)).toBe('en');
    expect(composeBCP47(mockSpanish)).toBe('es');
    expect(composeBCP47(mockChinese)).toBe('zh');
  });

  it('should compose language-region BCP 47 tags', () => {
    expect(composeBCP47(mockEnglish, undefined, mockUS)).toBe('en-US');
    expect(composeBCP47(mockSpanish, undefined, mockSpain)).toBe('es-ES');
    expect(composeBCP47(mockChinese, undefined, mockChina)).toBe('zh-CN');
  });

  it('should respect script suppression', () => {
    // Latin script should be suppressed for English
    expect(composeBCP47(mockEnglish, mockLatin)).toBe('en');
    
    // Latin script should be suppressed for Spanish
    expect(composeBCP47(mockSpanish, mockLatin)).toBe('es');
    
    // Chinese doesn't suppress any script, so script should be included
    expect(composeBCP47(mockChinese, mockSimplified)).toBe('zh-Hans');
    expect(composeBCP47(mockChinese, mockTraditional)).toBe('zh-Hant');
  });

  it('should handle full language-script-region combinations', () => {
    // English with Latin script (suppressed) and US region
    expect(composeBCP47(mockEnglish, mockLatin, mockUS)).toBe('en-US');
    
    // Spanish with Latin script (suppressed) and Spain region
    expect(composeBCP47(mockSpanish, mockLatin, mockSpain)).toBe('es-ES');
    
    // Chinese with Simplified script and China region
    expect(composeBCP47(mockChinese, mockSimplified, mockChina)).toBe('zh-Hans-CN');
    
    // Chinese with Traditional script and Taiwan region
    expect(composeBCP47(mockChinese, mockTraditional, mockTaiwan)).toBe('zh-Hant-TW');
  });

  it('should include non-suppressed scripts', () => {
    // If we explicitly specify a script that's not the suppressed script, it should be included
    const mockCyrillic: ScriptData = {
      name: 'Cyrillic',
      code: 'Cyrl',
      aliases: ['cyrillic']
    };
    
    // English with Cyrillic script (not suppressed) should include the script
    expect(composeBCP47(mockEnglish, mockCyrillic)).toBe('en-Cyrl');
    expect(composeBCP47(mockEnglish, mockCyrillic, mockUS)).toBe('en-Cyrl-US');
  });
});



    