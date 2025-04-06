/**Top languages grouped by usage */
import { normalizeLanguage } from "../languages/normalize";

export const commonLanguages = ["en", "fr", "es", "de"].map(
  (code) => normalizeLanguage(code)!,
);
