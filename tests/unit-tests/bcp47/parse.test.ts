import { describe, expect, it } from "vitest";
import { parseBCP47 } from "../../../src/bcp47/parser";

describe("parseBCP47", () => {
  it("parses simple language tag", () => {
    const result = parseBCP47("en");
    expect(result).toEqual({
      language: "en",
      script: undefined,
      region: undefined,
      raw: "en",
    });
  });

  it("parses full BCP47 with script and region", () => {
    const result = parseBCP47("zh-Hant-HK");
    expect(result).toEqual({
      language: "zh",
      script: "Hant",
      region: "HK",
      raw: "zh-Hant-HK",
    });
  });

  it("parses lowercase and underscored formats", () => {
    const result = parseBCP47("pt_br");
    expect(result).toEqual({
      language: "pt",
      script: undefined,
      region: "BR",
      raw: "pt_br",
    });
  });

  it("returns null for invalid input", () => {
    expect(parseBCP47("invalid-tag")).toBeNull();
    expect(parseBCP47("")).toBeNull();
  });

  it("parses script without region", () => {
    const result = parseBCP47("zh-Hant");
    expect(result).toEqual({
      language: "zh",
      script: "Hant",
      region: undefined,
      raw: "zh-Hant",
    });
  });
});
