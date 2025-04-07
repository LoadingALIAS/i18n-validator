import { test, expect, describe } from "vitest";
import { fuzzyMatch } from "../../../src/core/fuzzy/matcher";

// Basic functionality tests
describe("Basic Functionality", () => {
  test("exact matches", () => {
    const englishMatches = fuzzyMatch("en");
    expect(englishMatches.some(m => m.code === "en" && m.type === "language")).toBe(true);

    const usMatches = fuzzyMatch("US");
    expect(usMatches.some(m => m.code === "US" && m.type === "region")).toBe(true);
  });

  test("handles empty input", () => {
    const matches = fuzzyMatch("");
    expect(matches.length).toBe(0);
  });

  test("no matches for gibberish", () => {
    const matches = fuzzyMatch("xyzabc123");
    expect(matches.length).toBe(0);
  });

  test("respects maxDistance", () => {
    const closeMatches = fuzzyMatch("english", 1);
    const farMatches = fuzzyMatch("english", 3);
    expect(farMatches.length).toBeGreaterThan(closeMatches.length);
  });
});

// Real-world language code scenarios
describe("Language Code Matching", () => {
  test("common language code variations", () => {
    const variations = [
      { input: "eng", expected: "en" },
      { input: "english", expected: "en" },
      { input: "englsh", expected: "en" },
      { input: "englich", expected: "en" },
      { input: "Engels", expected: "en" },
      { input: "espanol", expected: "es" },
      { input: "spanish", expected: "es" },
      { input: "spnish", expected: "es" },
      { input: "deutch", expected: "de" },
      { input: "german", expected: "de" },
      { input: "germn", expected: "de" },
    ];

    for (const { input, expected } of variations) {
      const matches = fuzzyMatch(input);
      expect(matches.some(m => m.code === expected && m.type === "language"), 
        `Expected "${input}" to match "${expected}"`).toBe(true);
    }
  });

  test("handles mixed case input", () => {
    const variations = [
      "ENGLISH",
      "English",
      "eNgLiSh",
      "DEUTSCH",
      "Deutsch",
      "dEuTsCh"
    ];

    for (const input of variations) {
      const matches = fuzzyMatch(input);
      expect(matches.length).toBeGreaterThan(0);
    }
  });
});

// Real-world region code scenarios
describe("Region Code Matching", () => {
  test("common region name variations", () => {
    const variations = [
      { input: "united states", expected: "US" },
      { input: "usa", expected: "US" },
      { input: "united states of america", expected: "US" },
      { input: "unted states", expected: "US" },
      { input: "united kingdom", expected: "GB" },
      { input: "great britain", expected: "GB" },
      { input: "england", expected: "GB" },
      { input: "united arab emirates", expected: "AE" },
      { input: "uae", expected: "AE" },
      { input: "emirates", expected: "AE" },
    ];

    for (const { input, expected } of variations) {
      const matches = fuzzyMatch(input);
      expect(matches.some(m => m.code === expected && m.type === "region"),
        `Expected "${input}" to match "${expected}"`).toBe(true);
    }
  });

  test("handles region codes with different formats", () => {
    const variations = [
      { input: "us", expected: "US" },
      { input: "usa", expected: "US" },
      { input: "840", expected: "US" }, // numeric code
      { input: "gb", expected: "GB" },
      { input: "gbr", expected: "GB" },
      { input: "826", expected: "GB" }, // numeric code
    ];

    for (const { input, expected } of variations) {
      const matches = fuzzyMatch(input);
      expect(matches.some(m => m.code === expected && m.type === "region"),
        `Expected "${input}" to match "${expected}"`).toBe(true);
    }
  });
});

// Edge cases and special scenarios
describe("Edge Cases and Special Scenarios", () => {
  test("handles input with extra spaces", () => {
    const variations = [
      "  english  ",
      " united   states ",
      "great    britain",
      "   de   "
    ];

    for (const input of variations) {
      const matches = fuzzyMatch(input);
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  test("handles common typos", () => {
    const variations = [
      { input: "unted", expected: "US" },
      { input: "uinted", expected: "US" },
      { input: "untied", expected: "US" },
      { input: "englend", expected: "GB" },
      { input: "britan", expected: "GB" },
      { input: "deutchland", expected: "DE" },
      { input: "gemany", expected: "DE" },
    ];

    for (const { input, expected } of variations) {
      const matches = fuzzyMatch(input);
      expect(matches.some(m => m.code === expected && m.type === "region"),
        `Expected "${input}" to match "${expected}"`).toBe(true);
    }
  });

  test("handles ambiguous inputs", () => {
    // These inputs could potentially match multiple things
    const ambiguousCases = [
      "united", // Could match US, GB, AE, etc.
      "china",  // Could match CN (region) or zh (language)
      "indo",   // Could match ID (region) or in (language)
    ];

    for (const input of ambiguousCases) {
      const matches = fuzzyMatch(input);
      // Should return multiple matches for ambiguous inputs
      expect(matches.length).toBeGreaterThan(1);
    }
  });

  test("prioritizes exact matches over fuzzy matches", () => {
    const cases = [
      { input: "en", expectedFirst: { code: "en", type: "language" } },
      { input: "us", expectedFirst: { code: "US", type: "region" } },
      { input: "gb", expectedFirst: { code: "GB", type: "region" } },
    ];

    for (const { input, expectedFirst } of cases) {
      const matches = fuzzyMatch(input);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].code).toBe(expectedFirst.code);
      expect(matches[0].type).toBe(expectedFirst.type);
      expect(matches[0].distance).toBe(0);
    }
  });
}); 