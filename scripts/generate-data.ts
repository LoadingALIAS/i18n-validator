/**
 * DATA SOURCE DOCUMENTATION
 *
 * This script fetches data from the following authoritative sources:
 *
 * 1. IANA Language Subtag Registry:
 *    - The official registry for BCP 47 language tags
 *    - Defines language subtags, region subtags, script subtags, etc.
 *    - URL: https://www.iana.org/assignments/language-subtag-registry/
 *
 * 2. ISO 639 Language Codes:
 *    - ISO 639-2: Maintained by the Library of Congress (the official ISO 639-2 Registration Authority)
 *    - ISO 639-3: Maintained by SIL International (the official ISO 639-3 Registration Authority)
 *    - These provide comprehensive language code data including names, bibliographic codes, etc.
 *
 * 3. ISO 3166 Country Codes:
 *    - Official country code information from the UN/ISO datasets
 *    - Includes alpha-2, alpha-3, and numeric codes along with official names
 *
 * 4. ISO 15924 Script Codes:
 *    - Maintained by the Unicode Consortium
 *    - Provides standardized script codes and names
 *
 * Version information is extracted from each source when available and included
 * in the generated manifests for traceability.
 */

// Generates individual JSON files for languages, regions, and scripts from IANA and ISO sources
// Output structure:
// - src/data/languages/{code}.json: Individual language files
// - src/data/regions/{code}.json: Individual region files
// - src/data/scripts/{code}.json: Individual script files
// - src/data/groups/{name}.json: Predefined groups
// - */index.json: Manifests containing metadata and available codes
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import axios from "axios";
import type { LanguageData, RegionData, ScriptData } from "../src/types";

// Output directories for individual files and manifests
const OUT_DIR = join(process.cwd(), "src/data");
const OUT_LANGUAGES_DIR = join(OUT_DIR, "languages");
const OUT_REGIONS_DIR = join(OUT_DIR, "regions");
const OUT_SCRIPTS_DIR = join(OUT_DIR, "scripts");
const OUT_GROUPS_DIR = join(OUT_DIR, "groups");

// Manifest Files
const OUT_LANGUAGES_MANIFEST = join(OUT_LANGUAGES_DIR, "index.json");
const OUT_REGIONS_MANIFEST = join(OUT_REGIONS_DIR, "index.json");
const OUT_SCRIPTS_MANIFEST = join(OUT_SCRIPTS_DIR, "index.json");

// Source URLs for data fetching
const DATA_SOURCES = {
  // Primary
  IANA_REGISTRY: "https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry",

  // ISO 639 (languages)
  // Using the Library of Congress dataset for ISO 639 language codes
  // The Library of Congress is the official ISO 639-2 Registration Authority
  ISO639_2: "https://www.loc.gov/standards/iso639-2/ISO-639-2_utf-8.txt",
  // Using SIL International (the official ISO 639-3 Registration Authority) data
  ISO639_3: "https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3.tab",

  // ISO 3166 (regions)
  // Official dataset maintained through UN/ISO relationship
  ISO3166: "https://github.com/datasets/country-codes/raw/master/data/country-codes.csv",

  // ISO 15924 (scripts)
  // Official Unicode registry for ISO 15924 script codes
  ISO15924: "https://www.unicode.org/iso15924/iso15924.txt",
};

// Data source version tracking
// These will be populated during fetching and displayed in manifests
const DATA_VERSIONS = {
  IANA_REGISTRY: "",
  ISO639_2: "",
  ISO639_3: "",
  ISO3166: "",
  ISO15924: "",
};

// Helper to generate normalized aliases from data fields
// Handles:
// - Case normalization
// - Space removal
// - Diacritic removal
// - Special character handling
function generateAliases(fields: string[]): string[] {
  const aliases = new Set<string>();

  for (const field of fields) {
    if (!field) continue;

    // Add the original field
    const fieldLower = field.toLowerCase();
    aliases.add(fieldLower);

    // Remove spaces and special characters
    const noSpaces = fieldLower.replace(/\s+/g, "");
    if (noSpaces !== fieldLower) {
      aliases.add(noSpaces);
    }

    // Handle special characters and diacritics
    const simplified = fieldLower
      .normalize("NFD") // Decompose characters
      .replace(/[^\w\s]/g, "") // Remove non-word chars (includes diacritics)
      .normalize("NFC"); // Recompose what's left

    if (simplified !== fieldLower) {
      aliases.add(simplified);

      // Also add without spaces if different
      const simplifiedNoSpaces = simplified.replace(/\s+/g, "");
      if (simplifiedNoSpaces !== simplified) {
        aliases.add(simplifiedNoSpaces);
      }
    }
  }

  return Array.from(aliases);
}

// Type definitions
interface ISO3166Entry {
  name: string;
  official_name_en?: string;
  "alpha-2": string;
  "alpha-3": string;
  "country-code": string;
}

interface IANAEntry {
  Type: string;
  Subtag: string;
  Description: string | string[];
  Added: string;
  "Suppress-Script"?: string;
  Scope?: string;
  Macrolanguage?: string;
  "Preferred-Value"?: string;
}

interface ISO15924Entry {
  code: string; // Alpha-4 code
  numeric: string; // Numeric code
  name: string; // English name
  pva?: string | undefined; // Property Value Alias (short name)
  date: string; // Date added
}

/**
 * Extract version/date information from IANA Registry data
 */
function extractIANAVersion(content: string): string {
  const firstLine = content.split("\n")[0];
  const dateMatch = firstLine.match(/File-Date: (\d{4}-\d{2}-\d{2})/);
  return dateMatch ? dateMatch[1] : "unknown";
}

/**
 * Fetch and parse ISO 3166 country data from official sources
 */
async function getISO3166Data(): Promise<Record<string, ISO3166Entry>> {
  try {
    const response = await axios.get(DATA_SOURCES.ISO3166);

    // Extract a version or date from the response if possible
    const lastModified = response.headers["last-modified"];
    if (lastModified) {
      DATA_VERSIONS.ISO3166 = new Date(lastModified).toISOString().split("T")[0];
    }

    // Parse CSV content
    const csvContent = response.data;
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",");

    const alphaIdx = headers.findIndex((h: string) => h === "ISO3166-1-Alpha-2");
    const alpha3Idx = headers.findIndex((h: string) => h === "ISO3166-1-Alpha-3");
    const numericIdx = headers.findIndex((h: string) => h === "ISO3166-1-numeric");
    const nameIdx = headers.findIndex((h: string) => h === "CLDR display name");
    const officialNameIdx = headers.findIndex((h: string) => h === "official_name_en");

    const data: Record<string, ISO3166Entry> = {};

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(",");
      const cleanValue = (val: string) => val.replace(/^"(.*)"$/, "$1");

      const alpha2 = cleanValue(values[alphaIdx]);
      if (!alpha2 || alpha2.length !== 2) continue;

      data[alpha2] = {
        "alpha-2": alpha2,
        "alpha-3": cleanValue(values[alpha3Idx]),
        "country-code": cleanValue(values[numericIdx]),
        name: cleanValue(values[nameIdx]),
      };

      // Add official name if available
      const officialName = cleanValue(values[officialNameIdx]);
      if (officialName) {
        data[alpha2].official_name_en = officialName;
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching ISO 3166 data:", error);
    return {};
  }
}

/**
 * Parse the ISO 15924 text file from Unicode
 * Format described at: https://www.unicode.org/iso15924/
 */
async function parseISO15924Data(): Promise<Map<string, ISO15924Entry>> {
  try {
    const response = await fetch(DATA_SOURCES.ISO15924);
    const text = await response.text();
    const scriptMap = new Map<string, ISO15924Entry>();

    // Extract version date from header comments
    const dateMatch = text.match(/Date: (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      DATA_VERSIONS.ISO15924 = dateMatch[1];
    }

    // Process line by line, skipping comments and header
    const lines = text.split("\n");
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith("#") || line.trim() === "") continue;

      // Parse the tab-delimited format
      const parts = line.split(";").map((part) => part.trim());
      if (parts.length < 4) continue;

      const [code, numeric, name, pva, date] = parts;

      scriptMap.set(code, {
        code,
        numeric,
        name,
        pva: pva || undefined,
        date,
      });
    }

    return scriptMap;
  } catch (error) {
    console.error("Error fetching ISO 15924 data:", error);
    return new Map();
  }
}

async function parseIANARegistry(content: string): Promise<{
  languages: Record<string, LanguageData>;
  regions: Record<string, RegionData>;
  scripts: Record<string, ScriptData>;
}> {
  // Extract IANA version
  DATA_VERSIONS.IANA_REGISTRY = extractIANAVersion(content);

  const entries = content.split("%%").slice(1); // Skip file date
  const languages: Record<string, LanguageData> = {};
  const regions: Record<string, RegionData> = {};
  const scripts: Record<string, ScriptData> = {};
  const iso3166Data = await getISO3166Data();
  const iso15924Data = await parseISO15924Data();

  for (const entry of entries) {
    const lines = entry.trim().split("\n");
    const data: Partial<IANAEntry> = {};

    for (const line of lines) {
      const [key, ...valueParts] = line.split(": ");
      const value = valueParts.join(": ").trim();

      if (key === "Description") {
        if (!data.Description) {
          data.Description = [];
        }
        if (Array.isArray(data.Description)) {
          data.Description.push(value);
        }
      } else if (key) {
        data[key as keyof IANAEntry] = value;
      }
    }

    if (!data.Type || !data.Subtag) continue;

    switch (data.Type) {
      case "language":
        if (data.Subtag.length === 2) {
          const descriptions = Array.isArray(data.Description) ? data.Description : [data.Description || ""];
          const langData: LanguageData = {
            name: descriptions[0] || "",
            iso639_1: data.Subtag,
            iso639_2: "", // Will be filled from ISO639-2 data
            iso639_3: "", // Will be filled from ISO639-3 data
            aliases: generateAliases([
              ...descriptions,
              data.Subtag, // iso639_1
              // iso639_2 and iso639_3 will be added later
            ]),
          };

          // Handle optional fields
          if (data["Suppress-Script"]) {
            langData.suppressScript = data["Suppress-Script"];
          }
          if (data.Scope) {
            langData.scope = data.Scope as "macrolanguage" | "collection" | "special";
          }

          languages[data.Subtag] = langData;
        }
        break;

      case "region":
        if (data.Subtag?.length === 2) {
          const alpha2 = data.Subtag.toUpperCase();
          if (alpha2 === "AA" || alpha2 === "ZZ") continue;

          const descriptions = Array.isArray(data.Description) ? data.Description : [data.Description];
          const iso3166Entry = iso3166Data[alpha2];

          // Filter out undefined values and ensure strings
          const aliasFields = [
            ...descriptions.filter((d): d is string => typeof d === "string"),
            alpha2,
            iso3166Entry?.["alpha-3"],
            iso3166Entry?.["country-code"],
          ].filter((field): field is string => typeof field === "string");

          regions[alpha2] = {
            name: descriptions[0] || "",
            alpha2,
            alpha3: iso3166Entry?.["alpha-3"] || "",
            numeric: iso3166Entry?.["country-code"] || "",
            aliases: generateAliases(aliasFields),
          };
        }
        break;

      case "script":
        if (data.Subtag.length === 4) {
          const descriptions = Array.isArray(data.Description) ? data.Description : [data.Description || ""];
          const scriptCode = data.Subtag;
          const iso15924Entry = iso15924Data.get(scriptCode);

          // Prioritize ISO 15924 data but enrich with IANA descriptions
          const name = iso15924Entry?.name || descriptions[0] || "";

          // Combine all possible aliases
          const aliasFields = [
            ...descriptions.filter((d): d is string => typeof d === "string"),
            scriptCode,
            iso15924Entry?.pva,
            name,
          ].filter((field): field is string => typeof field === "string");

          scripts[scriptCode] = {
            name,
            code: scriptCode,
            aliases: generateAliases(aliasFields),
          };
        }
        break;
    }
  }

  // Process ISO 15924 scripts that might not be in IANA
  for (const [code, data] of iso15924Data.entries()) {
    // Skip if already processed from IANA
    if (scripts[code]) continue;

    scripts[code] = {
      name: data.name,
      code: data.code,
      aliases: generateAliases(
        [data.name, data.code, data.pva].filter((field): field is string => typeof field === "string"),
      ),
    };
  }

  return { languages, regions, scripts };
}

/**
 * Fetch and parse ISO 639-2 and ISO 639-3 language data from official sources
 */
async function fetchISO639Data(existingLanguages: Record<string, LanguageData>): Promise<Record<string, LanguageData>> {
  try {
    const [iso2Response, iso3Response] = await Promise.all([
      axios.get(DATA_SOURCES.ISO639_2, { responseType: "text" }),
      axios.get(DATA_SOURCES.ISO639_3, { responseType: "text" }),
    ]);

    // Extract version info if available
    const iso2LastModified = iso2Response.headers["last-modified"];
    if (iso2LastModified) {
      DATA_VERSIONS.ISO639_2 = new Date(iso2LastModified).toISOString().split("T")[0];
    }

    const iso3LastModified = iso3Response.headers["last-modified"];
    if (iso3LastModified) {
      DATA_VERSIONS.ISO639_3 = new Date(iso3LastModified).toISOString().split("T")[0];
    }

    // Process ISO 639-2 data (Library of Congress format)
    // Format: ISO639-2|ISO639-1|English name|French name
    const iso2Lines = iso2Response.data.split("\n");
    for (const line of iso2Lines) {
      if (!line.trim()) continue;

      const [iso639_2, iso639_1, englishName] = line.split("|");

      if (iso639_1) {
        const lang = existingLanguages[iso639_1.toLowerCase()];
        if (lang) {
          lang.iso639_2 = iso639_2;
          // Add ISO 639-2 code to aliases
          lang.aliases = generateAliases([...lang.aliases, iso639_2]);

          // If the name is more complete from ISO 639-2, use it
          if (englishName && (!lang.name || lang.name.length < englishName.length)) {
            lang.name = englishName;
            // Add the full name to aliases too
            lang.aliases = generateAliases([...lang.aliases, englishName]);
          }
        }
      }
    }

    // Process ISO 639-3 data (SIL International format)
    // Tab-delimited with header
    const iso3Lines = iso3Response.data.split("\n");
    // Skip header
    const iso3Data = iso3Lines.slice(1);

    for (const line of iso3Data) {
      if (!line.trim()) continue;

      const fields = line.split("\t");
      if (fields.length < 7) continue;

      const [id, part1, _part2b, _part2t, _name, scope] = fields;

      if (part1) {
        const lang = existingLanguages[part1.toLowerCase()];
        if (lang) {
          lang.iso639_3 = id;

          // Add scope information
          if (scope === "M") {
            lang.scope = "macrolanguage";
          } else if (scope === "S") {
            lang.scope = "special";
          }

          // Add ISO 639-3 code to aliases
          lang.aliases = generateAliases([...lang.aliases, id]);
        }
      }
    }

    return existingLanguages;
  } catch (error) {
    console.error("Error fetching ISO 639 data:", error);
    return existingLanguages;
  }
}

async function writeIndividualFiles(data: {
  languages: Record<string, LanguageData>;
  regions: Record<string, RegionData>;
  scripts: Record<string, ScriptData>;
}) {
  // Create output directories
  await Promise.all([
    mkdir(OUT_LANGUAGES_DIR, { recursive: true }),
    mkdir(OUT_REGIONS_DIR, { recursive: true }),
    mkdir(OUT_SCRIPTS_DIR, { recursive: true }),
    mkdir(OUT_GROUPS_DIR, { recursive: true }),
  ]);

  // Prepare manifests with metadata
  const manifests = {
    languages: {
      codes: [] as string[],
      total: 0,
      lastUpdated: new Date().toISOString(),
      dataSource: "IANA Language Subtag Registry + ISO 639-1/2/3",
      version: {
        iana: DATA_VERSIONS.IANA_REGISTRY,
        iso639_2: DATA_VERSIONS.ISO639_2,
        iso639_3: DATA_VERSIONS.ISO639_3,
      },
    },
    regions: {
      codes: [] as string[],
      total: 0,
      lastUpdated: new Date().toISOString(),
      dataSource: "IANA Language Subtag Registry + ISO 3166-1",
      version: {
        iana: DATA_VERSIONS.IANA_REGISTRY,
        iso3166: DATA_VERSIONS.ISO3166,
      },
    },
    scripts: {
      codes: [] as string[],
      total: 0,
      lastUpdated: new Date().toISOString(),
      dataSource: "IANA Language Subtag Registry + ISO 15924",
      version: {
        iana: DATA_VERSIONS.IANA_REGISTRY,
        iso15924: DATA_VERSIONS.ISO15924,
      },
    },
  };

  const writePromises: Promise<void>[] = [];

  // Write individual files
  for (const [code, langData] of Object.entries(data.languages)) {
    writePromises.push(writeFile(join(OUT_LANGUAGES_DIR, `${code}.json`), JSON.stringify(langData, null, 2)));
    manifests.languages.codes.push(code);
  }
  manifests.languages.total = manifests.languages.codes.length;
  manifests.languages.codes.sort();

  for (const [code, regionData] of Object.entries(data.regions)) {
    writePromises.push(writeFile(join(OUT_REGIONS_DIR, `${code}.json`), JSON.stringify(regionData, null, 2)));
    manifests.regions.codes.push(code);
  }
  manifests.regions.total = manifests.regions.codes.length;
  manifests.regions.codes.sort();

  for (const [code, scriptData] of Object.entries(data.scripts)) {
    writePromises.push(writeFile(join(OUT_SCRIPTS_DIR, `${code}.json`), JSON.stringify(scriptData, null, 2)));
    manifests.scripts.codes.push(code);
  }
  manifests.scripts.total = manifests.scripts.codes.length;
  manifests.scripts.codes.sort();

  // Write manifests
  writePromises.push(
    writeFile(OUT_LANGUAGES_MANIFEST, JSON.stringify(manifests.languages, null, 2)),
    writeFile(OUT_REGIONS_MANIFEST, JSON.stringify(manifests.regions, null, 2)),
    writeFile(OUT_SCRIPTS_MANIFEST, JSON.stringify(manifests.scripts, null, 2)),
  );

  // Define and write optimized group definitions
  interface GroupDefinition {
    name: string;
    description: string;
    languages?: string[];
    regions?: string[];
    scripts?: string[];
  }

  const groups: Record<string, GroupDefinition> = {
    "common-web": {
      name: "Common Web Locales",
      description: "Most commonly used codes for web applications",
      languages: ["en", "es", "fr", "de", "zh", "ja", "ko", "pt", "ru", "ar"],
      regions: ["US", "GB", "CA", "AU", "FR", "DE", "ES", "IT", "JP", "CN"],
      scripts: ["Latn", "Hans", "Hant", "Cyrl", "Arab"],
    },
    eu: {
      name: "European Union",
      description: "Official EU languages and member state regions",
      languages: [
        "bg",
        "cs",
        "da",
        "de",
        "el",
        "en",
        "es",
        "et",
        "fi",
        "fr",
        "ga",
        "hr",
        "hu",
        "it",
        "lt",
        "lv",
        "mt",
        "nl",
        "pl",
        "pt",
        "ro",
        "sk",
        "sl",
        "sv",
      ],
      regions: [
        "AT",
        "BE",
        "BG",
        "CY",
        "CZ",
        "DE",
        "DK",
        "EE",
        "ES",
        "FI",
        "FR",
        "GR",
        "HR",
        "HU",
        "IE",
        "IT",
        "LT",
        "LU",
        "LV",
        "MT",
        "NL",
        "PL",
        "PT",
        "RO",
        "SE",
        "SI",
        "SK",
      ],
      scripts: ["Latn", "Cyrl", "Grek"],
    },
    cjk: {
      name: "CJK Languages",
      description: "Chinese, Japanese, and Korean languages and scripts",
      languages: ["zh", "ja", "ko"],
      regions: ["CN", "HK", "TW", "JP", "KR"],
      scripts: ["Hans", "Hant", "Hani", "Kana", "Hira", "Hang"],
    },
  };

  // Write group definitions
  for (const [groupName, groupData] of Object.entries(groups)) {
    // Validate that all referenced codes exist
    const validateCodes = (codes: string[] | undefined, manifest: { codes: string[] }, type: string) => {
      if (!codes) return;
      const invalid = codes.filter((code) => !manifest.codes.includes(code));
      if (invalid.length > 0) {
        console.warn(`Warning: Group "${groupName}" references non-existent ${type} codes:`, invalid);
      }
    };

    validateCodes(groupData.languages, manifests.languages, "language");
    validateCodes(groupData.regions, manifests.regions, "region");
    validateCodes(groupData.scripts, manifests.scripts, "script");

    writePromises.push(writeFile(join(OUT_GROUPS_DIR, `${groupName}.json`), JSON.stringify(groupData, null, 2)));
  }

  await Promise.all(writePromises);

  // Log stats
  console.log("Data generation complete!");
  console.log("Statistics:");
  console.log(`- Languages: ${manifests.languages.total} files`);
  console.log(`- Regions: ${manifests.regions.total} files`);
  console.log(`- Scripts: ${manifests.scripts.total} files`);
  console.log(`- Groups: ${Object.keys(groups).length} files`);
  console.log("\nPredefined groups created:");
  for (const [name, group] of Object.entries(groups)) {
    console.log(`- ${name}: ${group.description}`);
  }
}

async function main() {
  try {
    console.log("Fetching IANA registry...");
    const response = await fetch(DATA_SOURCES.IANA_REGISTRY);
    const content = await response.text();

    console.log("Parsing IANA registry...");
    const data = await parseIANARegistry(content);

    console.log("Fetching additional ISO 639 data...");
    data.languages = await fetchISO639Data(data.languages);

    console.log("Writing individual files and manifests...");
    await writeIndividualFiles(data);
  } catch (error) {
    console.error("Error generating data:", error);
    process.exit(1);
  }
}

// Run the script
main();
