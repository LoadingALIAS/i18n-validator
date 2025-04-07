import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { DataLoader, dataLoader, loadLanguages, loadGroup, preloadGroup } from '../../../src/core/loader';
import type { LanguageData, RegionData, ScriptData } from '../../../src/types';

describe('DataLoader', () => {
  beforeEach(() => {
    // Clear cache before each test
    dataLoader.clearCache();
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = DataLoader.getInstance();
      const instance2 = DataLoader.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('exported dataLoader should be singleton instance', () => {
      const instance = DataLoader.getInstance();
      expect(dataLoader).toBe(instance);
    });
  });

  describe('Language Loading', () => {
    test('should load language data', async () => {
      const data = await dataLoader.loadLanguage('en');
      expect(data).toBeDefined();
      expect(data?.iso639_1).toBe('en');
    });

    test('should cache loaded language data', async () => {
      const first = await dataLoader.loadLanguage('en');
      const second = await dataLoader.loadLanguage('en');
      expect(first).toBe(second);
    });

    test('should handle invalid language code', async () => {
      const data = await dataLoader.loadLanguage('invalid');
      expect(data).toBeNull();
    });
  });

  describe('Region Loading', () => {
    test('should load region data', async () => {
      const data = await dataLoader.loadRegion('US');
      expect(data).toBeDefined();
      expect(data?.alpha2).toBe('US');
    });

    test('should cache loaded region data', async () => {
      const first = await dataLoader.loadRegion('US');
      const second = await dataLoader.loadRegion('US');
      expect(first).toBe(second);
    });

    test('should handle invalid region code', async () => {
      const data = await dataLoader.loadRegion('invalid');
      expect(data).toBeNull();
    });
  });

  describe('Script Loading', () => {
    test('should load script data', async () => {
      const data = await dataLoader.loadScript('Latn');
      expect(data).toBeDefined();
      expect(data?.code).toBe('Latn');
    });

    test('should cache loaded script data', async () => {
      const first = await dataLoader.loadScript('Latn');
      const second = await dataLoader.loadScript('Latn');
      expect(first).toBe(second);
    });

    test('should handle invalid script code', async () => {
      const data = await dataLoader.loadScript('invalid');
      expect(data).toBeNull();
    });
  });

  describe('Group Loading', () => {
    test('should load common group', async () => {
      const codes = await dataLoader.loadGroup('common');
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });

    test('should load european group', async () => {
      const codes = await dataLoader.loadGroup('european');
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });

    test('should load asian group', async () => {
      const codes = await dataLoader.loadGroup('asian');
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });

    test('should load script-based groups', async () => {
      const latin = await dataLoader.loadGroup('latin');
      const cyrillic = await dataLoader.loadGroup('cyrillic');
      const cjk = await dataLoader.loadGroup('cjk');

      expect(Array.isArray(latin)).toBe(true);
      expect(Array.isArray(cyrillic)).toBe(true);
      expect(Array.isArray(cjk)).toBe(true);
    });
  });

  describe('Multiple Loading', () => {
    test('should load multiple languages', async () => {
      const data = await dataLoader.loadMultiple(['en', 'es', 'fr'], 'language');
      expect(data.size).toBe(3);
      expect(data.get('en')).toBeDefined();
      expect(data.get('es')).toBeDefined();
      expect(data.get('fr')).toBeDefined();
    });

    test('should handle some invalid codes', async () => {
      const data = await dataLoader.loadMultiple(['en', 'invalid', 'fr'], 'language');
      expect(data.size).toBe(2);
      expect(data.get('en')).toBeDefined();
      expect(data.get('fr')).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    test('should clear all cache', () => {
      dataLoader.clearCache();
      // Verify cache is empty by checking internal maps
      expect(dataLoader['loadedLanguages'].size).toBe(0);
      expect(dataLoader['loadedRegions'].size).toBe(0);
      expect(dataLoader['loadedScripts'].size).toBe(0);
    });

    test('should clear specific cache type', () => {
      dataLoader.clearCache('language');
      expect(dataLoader['loadedLanguages'].size).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    test('loadLanguages should work', async () => {
      const data = await loadLanguages(['en', 'fr']);
      expect(data.size).toBe(2);
    });

    test('loadGroup should work', async () => {
      const codes = await loadGroup('common');
      expect(Array.isArray(codes)).toBe(true);
    });

    test('preloadGroup should work', async () => {
      const data = await preloadGroup('european');
      expect(data instanceof Map).toBe(true);
      expect(data.size).toBeGreaterThan(0);
    });
  });
}); 