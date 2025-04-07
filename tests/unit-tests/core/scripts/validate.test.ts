import { describe, expect, test } from "vitest";
import { isValidScriptCode, normalizeScriptCode } from "../../../../src/core/scripts/validate";

describe("Script Code Validation", () => {
  test("validates common script codes", () => {
    expect(isValidScriptCode("Latn")).toBe(true);
    expect(isValidScriptCode("Cyrl")).toBe(true);
    expect(isValidScriptCode("Hans")).toBe(true);
    expect(isValidScriptCode("Hant")).toBe(true);
    expect(isValidScriptCode("Arab")).toBe(true);
  });

  test("rejects invalid script codes", () => {
    expect(isValidScriptCode("XXXX")).toBe(false);
    expect(isValidScriptCode("Abcd")).toBe(false);
    expect(isValidScriptCode("123")).toBe(false);
    expect(isValidScriptCode("")).toBe(false);
  });
});

describe("Script Code Normalization", () => {
  test("normalizes valid script codes", () => {
    expect(normalizeScriptCode("latn")).toBe("Latn");
    expect(normalizeScriptCode("CYRL")).toBe("Cyrl");
    expect(normalizeScriptCode("hAnS")).toBe("Hans");
    expect(normalizeScriptCode("HANT")).toBe("Hant");
  });

  test("returns null for invalid script codes", () => {
    expect(normalizeScriptCode("xxxx")).toBeNull();
    expect(normalizeScriptCode("abc")).toBeNull();
    expect(normalizeScriptCode("12345")).toBeNull();
    expect(normalizeScriptCode("")).toBeNull();
  });
}); 