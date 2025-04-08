import { afterAll, beforeAll, vi } from "vitest";
import * as config from "../src/core/config";
import type { LanguageData, RegionData, ScriptData } from "../src/types";

// Mock data for testing
export const mockLanguageData: LanguageData = {
  name: "English",
  iso639_1: "en",
  iso639_2: "eng",
  iso639_3: "eng",
  suppressScript: "Latn",
  aliases: ["english"],
};

export const mockRegionData: RegionData = {
  name: "United States",
  alpha2: "US",
  alpha3: "USA",
  numeric: "840",
  aliases: ["usa", "united states", "america"],
};

export const mockScriptData: ScriptData = {
  name: "Latin",
  code: "Latn",
  aliases: ["latin"],
};

// Additional mock data
export const additionalLanguages: LanguageData[] = [
  {
    name: "French",
    iso639_1: "fr",
    iso639_2: "fra",
    iso639_3: "fra",
    suppressScript: "Latn",
    aliases: ["french", "français"],
  },
  {
    name: "Spanish",
    iso639_1: "es",
    iso639_2: "spa",
    iso639_3: "spa",
    suppressScript: "Latn",
    aliases: ["spanish", "español"],
  },
  {
    name: "Chinese",
    iso639_1: "zh",
    iso639_2: "zho",
    iso639_3: "zho",
    aliases: ["chinese", "中文"],
  },
];

export const additionalRegions: RegionData[] = [
  {
    name: "United Kingdom",
    alpha2: "GB",
    alpha3: "GBR",
    numeric: "826",
    aliases: ["uk", "britain", "united kingdom"],
  },
  {
    name: "France",
    alpha2: "FR",
    alpha3: "FRA",
    numeric: "250",
    aliases: ["france"],
  },
  {
    name: "Germany",
    alpha2: "DE",
    alpha3: "DEU",
    numeric: "276",
    aliases: ["germany", "deutschland"],
  },
];

export const additionalScripts: ScriptData[] = [
  {
    name: "Simplified Han",
    code: "Hans",
    aliases: ["simplified chinese", "simplified han"],
  },
  {
    name: "Traditional Han",
    code: "Hant",
    aliases: ["traditional chinese", "traditional han"],
  },
  {
    name: "Cyrillic",
    code: "Cyrl",
    aliases: ["cyrillic"],
  },
];

// Global test state
const globalTestState = {
  initialized: false,
  mockData: {
    languages: new Map<string, LanguageData>(),
    regions: new Map<string, RegionData>(),
    scripts: new Map<string, ScriptData>(),
  },
};

// Mocking functions for config
vi.mock("../src/core/config", async () => {
  const actual = await vi.importActual<typeof import("../src/core/config")>("../src/core/config");

  return {
    ...actual,
    // Override getter functions to return our mock data
    getLoadedLanguages: vi.fn(() => globalTestState.mockData.languages),
    getLoadedRegions: vi.fn(() => globalTestState.mockData.regions),
    getLoadedScripts: vi.fn(() => globalTestState.mockData.scripts),
    getLanguageData: vi.fn((code: string) => globalTestState.mockData.languages.get(code.toLowerCase())),
    getRegionData: vi.fn((code: string) => globalTestState.mockData.regions.get(code.toUpperCase())),
    getScriptData: vi.fn((code: string) => {
      const scriptCode = code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
      return globalTestState.mockData.scripts.get(scriptCode);
    }),
    isDataLoaded: vi.fn(() => globalTestState.initialized),
    // Keep original configure but make it use our mock data
    configure: vi.fn(async () => {
      // Clear any existing data
      globalTestState.mockData.languages.clear();
      globalTestState.mockData.regions.clear();
      globalTestState.mockData.scripts.clear();

      // Add base mock data
      globalTestState.mockData.languages.set("en", mockLanguageData);
      globalTestState.mockData.regions.set("US", mockRegionData);
      globalTestState.mockData.scripts.set("Latn", mockScriptData);

      // Add additional mock data
      for (const lang of additionalLanguages) {
        globalTestState.mockData.languages.set(lang.iso639_1, lang);
      }
      for (const region of additionalRegions) {
        globalTestState.mockData.regions.set(region.alpha2, region);
      }
      for (const script of additionalScripts) {
        globalTestState.mockData.scripts.set(script.code, script);
      }

      globalTestState.initialized = true;
      return Promise.resolve(); // Add proper return
    }),
    reset: vi.fn(() => {
      globalTestState.mockData.languages.clear();
      globalTestState.mockData.regions.clear();
      globalTestState.mockData.scripts.clear();
      globalTestState.initialized = false;
    }),
  };
});

beforeAll(async () => {
  if (!globalTestState.initialized) {
    // Initialize with mock data
    globalTestState.mockData.languages.set("en", mockLanguageData);
    globalTestState.mockData.regions.set("US", mockRegionData);
    globalTestState.mockData.scripts.set("Latn", mockScriptData);

    // Add additional mock data
    for (const lang of additionalLanguages) {
      globalTestState.mockData.languages.set(lang.iso639_1, lang);
    }
    for (const region of additionalRegions) {
      globalTestState.mockData.regions.set(region.alpha2, region);
    }
    for (const script of additionalScripts) {
      globalTestState.mockData.scripts.set(script.code, script);
    }

    globalTestState.initialized = true;

    // Ensure tests know data is available
    vi.mocked(config.isDataLoaded).mockReturnValue(true);
  }

  // Set up global test environment
  vi.useFakeTimers();
});

afterAll(() => {
  // Clean up global test state
  globalTestState.mockData.languages.clear();
  globalTestState.mockData.regions.clear();
  globalTestState.mockData.scripts.clear();
  globalTestState.initialized = false;

  // Restore timers
  vi.useRealTimers();
});

// Helper functions for tests
export function getMockData() {
  return globalTestState.mockData;
}

export function clearMockData() {
  globalTestState.mockData.languages.clear();
  globalTestState.mockData.regions.clear();
  globalTestState.mockData.scripts.clear();

  // Reset initialization flag
  globalTestState.initialized = false;
  vi.mocked(config.isDataLoaded).mockReturnValue(false);
}

export function addMockLanguage(data: LanguageData) {
  globalTestState.mockData.languages.set(data.iso639_1, data);
  globalTestState.initialized = true;
  vi.mocked(config.isDataLoaded).mockReturnValue(true);
}

export function addMockRegion(data: RegionData) {
  globalTestState.mockData.regions.set(data.alpha2, data);
  globalTestState.initialized = true;
  vi.mocked(config.isDataLoaded).mockReturnValue(true);
}

export function addMockScript(data: ScriptData) {
  globalTestState.mockData.scripts.set(data.code, data);
  globalTestState.initialized = true;
  vi.mocked(config.isDataLoaded).mockReturnValue(true);
}

// Special mock functions for config.test.ts
export function setupMockConfigTest() {
  // For the 'should load test data correctly' test
  globalTestState.mockData.languages.set("en", mockLanguageData);
  globalTestState.mockData.languages.set("fr", additionalLanguages[0]);
  globalTestState.mockData.languages.set("es", additionalLanguages[1]);
  globalTestState.mockData.languages.set("zh", additionalLanguages[2]);

  globalTestState.mockData.regions.set("US", mockRegionData);
  globalTestState.mockData.regions.set("GB", additionalRegions[0]);
  globalTestState.mockData.regions.set("FR", additionalRegions[1]);
  globalTestState.mockData.regions.set("DE", additionalRegions[2]);

  globalTestState.mockData.scripts.set("Latn", mockScriptData);
  globalTestState.mockData.scripts.set("Hans", additionalScripts[0]);
  globalTestState.mockData.scripts.set("Hant", additionalScripts[1]);
  globalTestState.mockData.scripts.set("Cyrl", additionalScripts[2]);

  globalTestState.initialized = true;
  vi.mocked(config.isDataLoaded).mockReturnValue(true);
}
