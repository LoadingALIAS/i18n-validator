import { regions } from "../../regions/db";
import type { RegionData } from "../../types";

const regionAliasMap: Record<string, RegionData> = {};

for (const region of regions) {
  for (const alias of region.aliases) {
    regionAliasMap[alias.toLowerCase()] = region;
  }
}

export function normalizeRegionCode(input: string): RegionData | undefined {
  return regionAliasMap[input.toLowerCase()];
}
