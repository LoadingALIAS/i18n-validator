import { test, expect } from "vitest";
import { validateWithFeedback } from "../../../src";
import { fuzzyMatch } from "../../../src/core/fuzzy/matcher";

test("Basic success - language only", () => {
  const result = validateWithFeedback("en");
  expect(result.isValid).toBe(true);
  expect(result.normalized).toBe("en");
  expect(result.details?.language?.valid).toBe(true);
});

test("Basic success - language and region", () => {
  const result = validateWithFeedback("eng_US");
  expect(result.isValid).toBe(true);
  expect(result.normalized).toBe("en-US");
  expect(result.details?.language?.valid).toBe(true);
  expect(result.details?.region?.valid).toBe(true);
});

test("Invalid input - unknown language with suggestions", () => {
  const result = validateWithFeedback("englsh");
  expect(result.isValid).toBe(false);
  expect(result.normalized).toBeUndefined();
  expect(result.helpText).toContain("invalid language code");
  expect(result.details?.language?.valid).toBe(false);
  expect(result.suggestions).toBeDefined();
  expect(result.suggestions).toContain("en");
});

test("Invalid input - unknown region with suggestions", () => {
  const result = validateWithFeedback("en_unted");
  console.log("Raw region:", result.details?.region?.code);
  console.log("Fuzzy matches:", fuzzyMatch(result.details?.region?.code || ""));
  console.log("Suggestions:", result.suggestions);
  expect(result.isValid).toBe(false);
  expect(result.normalized).toBeUndefined();
  expect(result.helpText).toContain("invalid region code");
  expect(result.details?.language?.valid).toBe(true);
  expect(result.details?.region?.valid).toBe(false);
  expect(result.suggestions).toBeDefined();
  expect(result.suggestions?.some(s => s.startsWith("en-"))).toBe(true);
});

test("Empty input handling", () => {
  const result = validateWithFeedback("");
  expect(result.isValid).toBe(false);
  expect(result.helpText).toBe("Input cannot be empty");
});

test("Different separators", () => {
  const hyphen = validateWithFeedback("en-US");
  const underscore = validateWithFeedback("en_US");
  const space = validateWithFeedback("en US");
  
  expect(hyphen.normalized).toBe("en-US");
  expect(underscore.normalized).toBe("en-US");
  expect(space.normalized).toBe("en-US");
});

test("Fuzzy suggestions in help text", () => {
  const result = validateWithFeedback("englsh_unted");
  expect(result.helpText).toContain("Did you mean:");
  expect(result.suggestions?.length).toBeGreaterThan(0);
}); 