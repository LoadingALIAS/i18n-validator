import type { LanguageData, RegionData, ScriptData } from "../types";

type DataType = 'language' | 'region' | 'script';
type DataGroup = 'common' | 'european' | 'asian' | 'cyrillic' | 'latin' | 'cjk';

export class DataLoader {
  private static instance: DataLoader;
  private loadedLanguages: Map<string, LanguageData>;
  private loadedRegions: Map<string, RegionData>;
  private loadedScripts: Map<string, ScriptData>;

  private constructor() {
    this.loadedLanguages = new Map();
    this.loadedRegions = new Map();
    this.loadedScripts = new Map();
  }

  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  async loadLanguage(code: string): Promise<LanguageData | null> {
    if (this.loadedLanguages.has(code)) {
      return this.loadedLanguages.get(code) || null;
    }

    try {
      const data = await import(`../data/languages/${code}`);
      this.loadedLanguages.set(code, data.default);
      return data.default;
    } catch {
      return null;
    }
  }

  async loadRegion(code: string): Promise<RegionData | null> {
    if (this.loadedRegions.has(code)) {
      return this.loadedRegions.get(code) || null;
    }

    try {
      const data = await import(`../data/regions/${code}`);
      this.loadedRegions.set(code, data.default);
      return data.default;
    } catch {
      return null;
    }
  }

  async loadScript(code: string): Promise<ScriptData | null> {
    if (this.loadedScripts.has(code)) {
      return this.loadedScripts.get(code) || null;
    }

    try {
      const data = await import(`../data/scripts/${code}`);
      this.loadedScripts.set(code, data.default);
      return data.default;
    } catch {
      return null;
    }
  }

  async loadGroup(group: DataGroup): Promise<string[]> {
    try {
      let data;
      switch (group) {
        case 'common':
        case 'european':
        case 'asian':
          data = await import(`../groups/common`);
          return group === 'common' 
            ? data.commonLanguages 
            : group === 'european'
              ? data.europeanLanguages
              : data.asianLanguages;
        
        case 'cyrillic':
        case 'latin':
        case 'cjk':
          data = await import(`../groups/byScript`);
          return group === 'cyrillic'
            ? data.cyrillicScriptLanguages
            : group === 'latin'
              ? data.latinScriptLanguages
              : data.cjkScriptLanguages;
      }
    } catch {
      return [];
    }
  }

  async loadMultiple(codes: string[], type: DataType): Promise<Map<string, any>> {
    const promises = codes.map(code => {
      switch (type) {
        case 'language':
          return this.loadLanguage(code).then(data => ({ code, data }));
        case 'region':
          return this.loadRegion(code).then(data => ({ code, data }));
        case 'script':
          return this.loadScript(code).then(data => ({ code, data }));
      }
    });

    const results = await Promise.all(promises);
    return new Map(
      results
        .filter(result => result.data !== null)
        .map(result => [result.code, result.data])
    );
  }

  clearCache(type?: DataType) {
    if (!type || type === 'language') this.loadedLanguages.clear();
    if (!type || type === 'region') this.loadedRegions.clear();
    if (!type || type === 'script') this.loadedScripts.clear();
  }
}

// Export singleton instance
export const dataLoader = DataLoader.getInstance();

// Helper functions for common operations
export async function loadLanguages(codes: string[]): Promise<Map<string, LanguageData>> {
  return await dataLoader.loadMultiple(codes, 'language') as Map<string, LanguageData>;
}

export async function loadGroup(group: DataGroup): Promise<string[]> {
  return await dataLoader.loadGroup(group);
}

export async function preloadGroup(group: DataGroup): Promise<Map<string, LanguageData>> {
  const codes = await loadGroup(group);
  return await loadLanguages(codes);
} 