import { describe, it, expect } from "vitest";
import { validateBCP47 } from "../../../src/bcp47/validate";

describe("validateBCP47", () => {
  it("should validate simple language codes", () => {
    expect(validateBCP47("en")).toBe(true);
    expect(validateBCP47("fr")).toBe(true);
  });

  it("should validate language-region codes", () => {
    expect(validateBCP47("en-US")).toBe(true);
    expect(validateBCP47("fr-FR")).toBe(true);
  });

  it("should validate with script included", () => {
    expect(validateBCP47("zh-Hant-HK")).toBe(true);
  });

  it("should fail invalid language", () => {
    expect(validateBCP47("zz-XX")).toBe(false);
  });

  it("should fail malformed tag", () => {
    expect(validateBCP47("en_us")).toBe(false);
    expect(validateBCP47("123")).toBe(false);
  });
});
