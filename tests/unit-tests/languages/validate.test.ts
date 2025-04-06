import { describe, it, expect } from "vitest";
import { isValidLanguageCode } from "../../../src/core/languages/validate";

describe("isValidLanguageCode", () => {
  it("should validate correct language codes", () => {
    expect(isValidLanguageCode("en")).toBe(true);
    expect(isValidLanguageCode("EN")).toBe(true);
    expect(isValidLanguageCode("english")).toBe(true);
  });

  it("should invalidate incorrect language codes", () => {
    expect(isValidLanguageCode("xyz")).toBe(false);
  });
});
