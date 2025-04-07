import { describe, expect, test } from "vitest";
import { parseBCP47 } from "../../../src/bcp47/parser";

describe("BCP47 Parser", () => {
  test("parses simple language codes", () => {
    expect(parseBCP47("en")).toEqual({
      language: "en",
      raw: "en",
    });
  });

  test("parses language-region codes", () => {
    expect(parseBCP47("en-US")).toEqual({
      language: "en",
      region: "US",
      raw: "en-US",
    });
  });

  test("parses language-script codes", () => {
    expect(parseBCP47("zh-Hant")).toEqual({
      language: "zh",
      script: "Hant",
      raw: "zh-Hant",
    });
  });

  test("parses language-script-region codes", () => {
    expect(parseBCP47("zh-Hant-HK")).toEqual({
      language: "zh",
      script: "Hant",
      region: "HK",
      raw: "zh-Hant-HK",
    });
  });

  test("handles sloppy input", () => {
    expect(parseBCP47("ZH_hant_HK")).toEqual({
      language: "zh",
      script: "Hant",
      region: "HK",
      raw: "ZH_hant_HK",
    });
  });

  test("rejects invalid script codes", () => {
    expect(parseBCP47("zh-ABCD-HK")).toBeNull();
  });

  test("rejects invalid formats", () => {
    expect(parseBCP47("")).toBeNull();
    expect(parseBCP47("a")).toBeNull();
    expect(parseBCP47("en-US-Hant")).toBeNull(); // Wrong order
    expect(parseBCP47("en-US-GB")).toBeNull(); // Two regions
  });
});

