import { afterAll, beforeAll, vi } from "vitest";
import * as config from "../src/core/config";
import type { LanguageData, RegionData, ScriptData } from "../src/types";
import {
  getTestLanguages,
  getTestRegions,
  getTestScripts,
  isTestDataInitialized,
  isValidLanguageCode,
  resetTestData,
  setTestData,
  testComposeBCP47,
} from "./utils/test-utils";

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

// Mocking functions for config
vi.mock("../src/core/config", async () => {
  const actual = await vi.importActual<typeof import("../src/core/config")>("../src/core/config");

  return {
    ...actual,
    // Override getter functions to return our mock data
    getLoadedLanguages: vi.fn(() => getTestLanguages()),
    getLoadedRegions: vi.fn(() => getTestRegions()),
    getLoadedScripts: vi.fn(() => getTestScripts()),
    getLanguageData: vi.fn((code: string) => getTestLanguages().get(code.toLowerCase())),
    getRegionData: vi.fn((code: string) => getTestRegions().get(code.toUpperCase())),
    getScriptData: vi.fn((code: string) => {
      const scriptCode = code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
      return getTestScripts().get(scriptCode);
    }),
    isDataLoaded: vi.fn(() => isTestDataInitialized()),
    isValidLanguageCode: vi.fn((code: string) => isValidLanguageCode(code)),
    // Keep original configure but make it use our mock data
    configure: vi.fn(async () => {
      // Create mock data objects
      const languages: Record<string, LanguageData> = {
        en: mockLanguageData,
      };

      const regions: Record<string, RegionData> = {
        US: mockRegionData,
      };

      const scripts: Record<string, ScriptData> = {
        Latn: mockScriptData,
      };

      // Add additional mock data
      for (const lang of additionalLanguages) {
        languages[lang.iso639_1] = lang;
      }

      for (const region of additionalRegions) {
        regions[region.alpha2] = region;
      }

      for (const script of additionalScripts) {
        scripts[script.code] = script;
      }

      // Use the setTestData function to set all the data at once
      setTestData(languages, regions, scripts);

      return Promise.resolve();
    }),
    reset: vi.fn(() => {
      resetTestData();
    }),
  };
});

// Mock the bcp47Composer module
vi.mock("../src/core/bcp47Composer", () => {
  return {
    composeBCP47: vi.fn((lang, script, region) => {
      return testComposeBCP47(lang, script, region);
    }),
  };
});

beforeAll(async () => {
  if (!isTestDataInitialized()) {
    // Initialize with mock data
    const languages: Record<string, LanguageData> = {
      en: mockLanguageData,
    };

    const regions: Record<string, RegionData> = {
      US: mockRegionData,
    };

    const scripts: Record<string, ScriptData> = {
      Latn: mockScriptData,
    };

    // Add additional mock data
    for (const lang of additionalLanguages) {
      languages[lang.iso639_1] = lang;
    }

    for (const region of additionalRegions) {
      regions[region.alpha2] = region;
    }

    for (const script of additionalScripts) {
      scripts[script.code] = script;
    }

    // Use the setTestData function to set all the data at once
    setTestData(languages, regions, scripts);

    // Ensure tests know data is available
    vi.mocked(config.isDataLoaded).mockReturnValue(true);
  }

  // Set up global test environment
  vi.useFakeTimers();
});

afterAll(() => {
  // Clean up global test state
  resetTestData();

  // Restore timers
  vi.useRealTimers();
});

// Helper functions for tests
export function getMockData() {
  return {
    languages: getTestLanguages(),
    regions: getTestRegions(),
    scripts: getTestScripts(),
  };
}

export function clearMockData() {
  resetTestData();
  vi.mocked(config.isDataLoaded).mockReturnValue(false);
}

export function addMockLanguage(data: LanguageData) {
  const languages: Record<string, LanguageData> = {};
  languages[data.iso639_1] = data;

  // Keep existing data
  const currentLanguages = getTestLanguages();
  const currentRegions = getTestRegions();
  const currentScripts = getTestScripts();

  // Convert Maps to Records
  const regionsRecord: Record<string, RegionData> = {};
  currentRegions.forEach((value, key) => {
    regionsRecord[key] = value;
  });

  const scriptsRecord: Record<string, ScriptData> = {};
  currentScripts.forEach((value, key) => {
    scriptsRecord[key] = value;
  });

  setTestData(languages, regionsRecord, scriptsRecord);
  vi.mocked(config.isDataLoaded).mockReturnValue(true);
}

export function addMockRegion(data: RegionData) {
  const regions: Record<string, RegionData> = {};
  regions[data.alpha2] = data;

  // Keep existing data
  const currentLanguages = getTestLanguages();
  const currentRegions = getTestRegions();
  const currentScripts = getTestScripts();

  // Convert Maps to Records
  const languagesRecord: Record<string, LanguageData> = {};
  currentLanguages.forEach((value, key) => {
    languagesRecord[key] = value;
  });

  const scriptsRecord: Record<string, ScriptData> = {};
  currentScripts.forEach((value, key) => {
    scriptsRecord[key] = value;
  });

  setTestData(languagesRecord, regions, scriptsRecord);
  vi.mocked(config.isDataLoaded).mockReturnValue(true);
}

export function addMockScript(data: ScriptData) {
  const scripts: Record<string, ScriptData> = {};
  scripts[data.code] = data;

  // Keep existing data
  const currentLanguages = getTestLanguages();
  const currentRegions = getTestRegions();
  const currentScripts = getTestScripts();

  // Convert Maps to Records
  const languagesRecord: Record<string, LanguageData> = {};
  currentLanguages.forEach((value, key) => {
    languagesRecord[key] = value;
  });

  const regionsRecord: Record<string, RegionData> = {};
  currentRegions.forEach((value, key) => {
    regionsRecord[key] = value;
  });

  setTestData(languagesRecord, regionsRecord, scripts);
  vi.mocked(config.isDataLoaded).mockReturnValue(true);
}

// Special mock functions for config.test.ts
export function setupMockConfigTest() {
  // Create mock data objects with test data
  const languages: Record<string, LanguageData> = {
    en: mockLanguageData,
    fr: additionalLanguages[0],
    es: additionalLanguages[1],
    zh: additionalLanguages[2],
  };

  const regions: Record<string, RegionData> = {
    US: mockRegionData,
    GB: additionalRegions[0],
    FR: additionalRegions[1],
    DE: additionalRegions[2],
  };

  const scripts: Record<string, ScriptData> = {
    Latn: mockScriptData,
    Hans: additionalScripts[0],
    Hant: additionalScripts[1],
    Cyrl: additionalScripts[2],
  };

  // Use the setTestData function
  setTestData(languages, regions, scripts);
  vi.mocked(config.isDataLoaded).mockReturnValue(true);
}
