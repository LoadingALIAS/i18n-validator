import { describe, it, expect } from "vitest";
import { normalizeRegionCode } from "../../../src/core/regions/normalize";

describe("normalizeRegionCode", () => {
  it("should normalize region aliases", () => {
    expect(normalizeRegionCode("de")?.alpha2).toBe("DE");
    expect(normalizeRegionCode("germany")?.alpha2).toBe("DE");
    expect(normalizeRegionCode("DEU")?.alpha2).toBe("DE");
  });

  it("should return undefined for unknown region", () => {
    expect(normalizeRegionCode("xx")).toBeUndefined();
  });
});
