import { normalizeLanguageCode } from "./normalize";

export function isValidLanguageCode(input: string): boolean {
  return !!normalizeLanguageCode(input);
}
