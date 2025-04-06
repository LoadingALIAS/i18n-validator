import { describe, it, expect } from "vitest";
import { normalizeLanguageCode } from "../../../src/core/languages/normalize";

describe("normalizeLanguageCode", () => {
  it("should normalize common language aliases", () => {
    expect(normalizeLanguageCode("en")?.iso639_1).toBe("en");
    expect(normalizeLanguageCode("EN")?.iso639_1).toBe("en");
    expect(normalizeLanguageCode("english")?.iso639_1).toBe("en");
    expect(normalizeLanguageCode("eng")?.iso639_1).toBe("en");
  });

  it("should return undefined for unknown language", () => {
    expect(normalizeLanguageCode("xx")).toBeUndefined();
  });
});
