import { describe, it, expect } from "vitest";
import { isValidRegionCode } from "../../../src/core/regions/validate";

describe("isValidRegionCode", () => {
  it("should validate correct region codes", () => {
    expect(isValidRegionCode("DE")).toBe(true);
    expect(isValidRegionCode("de")).toBe(true);
    expect(isValidRegionCode("germany")).toBe(true);
  });

  it("should invalidate incorrect region codes", () => {
    expect(isValidRegionCode("zzz")).toBe(false);
  });
});
