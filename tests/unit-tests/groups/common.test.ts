import { describe, expect, test } from "vitest";
import {
  commonLanguages,
  europeanLanguages,
  asianLanguages,
  createValidator,
} from "../../../src/groups/common";
import {
  northAmericanLanguages,
  indianSubcontinentLanguages,
} from "../../../src/groups/byRegion";
import {
  latinScriptLanguages,
  cyrillicScriptLanguages,
} from "../../../src/groups/byScript";

describe("Language Groups", () => {
  test("commonLanguages contains expected languages", () => {
    expect(commonLanguages).toContain("en");
    expect(commonLanguages).toContain("zh");
    expect(commonLanguages).toContain("hi");
    expect(commonLanguages.length).toBeGreaterThan(5);
  });

  test("europeanLanguages contains expected languages", () => {
    expect(europeanLanguages).toContain("fr");
    expect(europeanLanguages).toContain("de");
    expect(europeanLanguages).not.toContain("zh");
  });

  test("asianLanguages contains expected languages", () => {
    expect(asianLanguages).toContain("zh");
    expect(asianLanguages).toContain("ja");
    expect(asianLanguages).not.toContain("en");
  });
});

describe("Region-based Groups", () => {
  test("northAmericanLanguages contains expected languages", () => {
    expect(northAmericanLanguages).toContain("en");
    expect(northAmericanLanguages).toContain("es");
    expect(northAmericanLanguages).toContain("fr");
  });

  test("indianSubcontinentLanguages contains expected languages", () => {
    expect(indianSubcontinentLanguages).toContain("hi");
    expect(indianSubcontinentLanguages).toContain("bn");
    expect(indianSubcontinentLanguages).not.toContain("en");
  });
});

describe("Script-based Groups", () => {
  test("latinScriptLanguages contains expected languages", () => {
    expect(latinScriptLanguages).toContain("en");
    expect(latinScriptLanguages).toContain("es");
    expect(latinScriptLanguages).not.toContain("zh");
  });

  test("cyrillicScriptLanguages contains expected languages", () => {
    expect(cyrillicScriptLanguages).toContain("ru");
    expect(cyrillicScriptLanguages).toContain("uk");
    expect(cyrillicScriptLanguages).not.toContain("en");
  });
});

describe("createValidator", () => {
  test("creates a validator for a subset of languages", () => {
    const validator = createValidator(["en", "es", "fr"]);
    
    expect(validator.isValidLanguageCode("en")).toBe(true);
    expect(validator.isValidLanguageCode("es")).toBe(true);
    expect(validator.isValidLanguageCode("zh")).toBe(false);
  });

  test("validator handles normalized codes", () => {
    const validator = createValidator(["eng", "spa"]);
    
    expect(validator.isValidLanguageCode("en")).toBe(true);
    expect(validator.isValidLanguageCode("es")).toBe(true);
    expect(validator.isValidLanguageCode("eng")).toBe(true);
    expect(validator.isValidLanguageCode("zh")).toBe(false);
  });
}); 