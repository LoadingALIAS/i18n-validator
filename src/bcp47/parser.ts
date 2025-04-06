import { normalizeLanguageCode } from "../core/languages/normalize";
import { normalizeRegionCode } from "../core/regions/normalize";

export interface ParsedBCP47 {
  language: string;
  script?: string;
  region?: string;
  raw: string;
}

function titleCase(str: string): string {
  return str.length === 4
    ? str[0].toUpperCase() + str.slice(1).toLowerCase()
    : str;
}

/**
 * Parses a BCP 47 tag into its parts (language, script, region).
 * Supports language[-Script][-Region] forms, including sloppy formats.
 */
export function parseBCP47(tag: string): ParsedBCP47 | null {
  if (!tag) return null;

  // Store the original tag for the raw property
  const originalTag = tag;

  // Normalize for parsing
  const normalized = tag.replace(/_/g, "-").trim();
  const parts = normalized.split("-");
  if (!parts.length || parts.length > 3) return null;

  const [part1, part2, part3] = parts;
  const language = normalizeLanguageCode(part1);
  if (!language) return null;

  let script: string | undefined;
  let region: string | undefined;

  if (part2 && /^[a-z]{4}$/i.test(part2)) {
    script = titleCase(part2);
    if (part3) {
      const regionData = normalizeRegionCode(part3);
      if (regionData) region = regionData.alpha2;
      else return null;
    }
  } else if (part2) {
    const regionData = normalizeRegionCode(part2);
    if (regionData) region = regionData.alpha2;
    else return null;
  }

  return {
    language: language.iso639_1,
    script,
    region,
    raw: originalTag, // Use the original tag instead of the normalized version
  };
}
