import { normalizeRegionCode } from "./normalize";

export function isValidRegionCode(input: string): boolean {
  return !!normalizeRegionCode(input);
}
