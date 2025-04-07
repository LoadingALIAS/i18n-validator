import { beforeAll, afterAll, vi } from "vitest";
import type { LanguageData, RegionData, ScriptData } from "../src/types";

// Mock data for testing
export const mockLanguageData: LanguageData = {
  name: "English",
  native: "English",
  iso639_1: "en",
  iso639_2: "eng",
  iso639_3: "eng",
  bcp47: "en",
  aliases: ["english"],
  added: "2001-07-02"
};

export const mockRegionData: RegionData = {
  name: "United States",
  alpha2: "US",
  alpha3: "USA",
  numeric: "840",
  aliases: ["usa", "united states", "america"],
  added: "2001-07-02"
};

export const mockScriptData: ScriptData = {
  name: "Latin",
  code: "Latn",
  numeric: "215",
  aliases: ["latin"],
  added: "2004-05-01"
};

// Global test state
let globalTestState = {
  initialized: false,
  mockData: {
    languages: new Map<string, LanguageData>(),
    regions: new Map<string, RegionData>(),
    scripts: new Map<string, ScriptData>()
  }
};

beforeAll(() => {
  if (!globalTestState.initialized) {
    // Initialize mock data
    globalTestState.mockData.languages.set("en", mockLanguageData);
    globalTestState.mockData.regions.set("US", mockRegionData);
    globalTestState.mockData.scripts.set("Latn", mockScriptData);
    globalTestState.initialized = true;
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
}

export function addMockLanguage(data: LanguageData) {
  globalTestState.mockData.languages.set(data.iso639_1, data);
}

export function addMockRegion(data: RegionData) {
  globalTestState.mockData.regions.set(data.alpha2, data);
}

export function addMockScript(data: ScriptData) {
  globalTestState.mockData.scripts.set(data.code, data);
}
