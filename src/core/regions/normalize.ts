import { regions } from "../../data/regions/db";
import type { RegionData } from "../../types";

const regionAliasMap: Record<string, RegionData> = {};

for (const region of regions) {
  // Add the region itself
  regionAliasMap[region.alpha2.toLowerCase()] = region;
  // Add all aliases
  for (const alias of region.aliases) {
    regionAliasMap[alias.toLowerCase()] = region;
  }
  // Add alpha3 code if available
  if (region.alpha3) {
    regionAliasMap[region.alpha3.toLowerCase()] = region;
  }
  // Add numeric code if available
  if (region.numeric) {
    regionAliasMap[region.numeric] = region;
  }
}

/**
 * Normalizes a region code to a RegionData object
 * @param input The region code or name to normalize
 * @returns The RegionData object if found, undefined otherwise
 */
export function normalizeRegionCode(input: string): RegionData | undefined {
  if (!input) return undefined;
  return regionAliasMap[input.toLowerCase()];
}
