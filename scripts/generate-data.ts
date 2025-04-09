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
  ISO639_2: "https://raw.githubusercontent.com/mamantoha/iso_codes/main/data/iso_639-2.json",
  ISO639_3: "https://raw.githubusercontent.com/bbenno/languages/master/data/iso-639-3.tsv",

  // ISO 3166 (regions)
  ISO3166: "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json",

  // ISO 15924 (scripts)
  ISO15924: "https://www.unicode.org/iso15924/iso15924.txt",
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

interface ISO639_2_Entry {
  alpha_2?: string;
  alpha_3: string;
  name: string;
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

interface ISO3166Entry {
  name: string;
  "alpha-2": string;
  "alpha-3": string;
  "country-code": string;
}

async function getISO3166Data(): Promise<Record<string, ISO3166Entry>> {
  try {
    const response = await fetch(DATA_SOURCES.ISO3166);
    const data = (await response.json()) as ISO3166Entry[];
    return data.reduce(
      (acc, entry) => {
        acc[entry["alpha-2"]] = entry;
        return acc;
      },
      {} as Record<string, ISO3166Entry>,
    );
  } catch (error) {
    console.error("Error fetching ISO 3166 data:", error);
    return {};
  }
}

async function parseIANARegistry(content: string): Promise<{
  languages: Record<string, LanguageData>;
  regions: Record<string, RegionData>;
  scripts: Record<string, ScriptData>;
}> {
  const entries = content.split("%%").slice(1); // Skip file date
  const languages: Record<string, LanguageData> = {};
  const regions: Record<string, RegionData> = {};
  const scripts: Record<string, ScriptData> = {};
  const iso3166Data = await getISO3166Data();

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
          scripts[data.Subtag] = {
            name: descriptions[0] || "",
            code: data.Subtag,
            aliases: generateAliases([...descriptions, data.Subtag]),
          };
        }
        break;
    }
  }

  return { languages, regions, scripts };
}

async function fetchISO639Data(existingLanguages: Record<string, LanguageData>): Promise<Record<string, LanguageData>> {
  try {
    const [{ data: iso2Data }, { data: iso3Raw }] = await Promise.all([
      axios.get<{ "639-2": ISO639_2_Entry[] }>(DATA_SOURCES.ISO639_2),
      axios.get<string>(DATA_SOURCES.ISO639_3),
    ]);

    // Process ISO 639-2 data
    for (const entry of iso2Data["639-2"]) {
      if (entry.alpha_2) {
        const lang = existingLanguages[entry.alpha_2.toLowerCase()];
        if (lang) {
          lang.iso639_2 = entry.alpha_3;
          // Add ISO 639-2 code to aliases
          lang.aliases = generateAliases([...lang.aliases, entry.alpha_3]);
        }
      }
    }

    // Process ISO 639-3 data
    const lines = iso3Raw.split("\n").slice(1); // skip header
    for (const line of lines) {
      const [id, _part2b, _part2t, part1] = line.split("\t");
      if (part1) {
        const lang = existingLanguages[part1.toLowerCase()];
        if (lang) {
          lang.iso639_3 = id;
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
    },
    regions: {
      codes: [] as string[],
      total: 0,
      lastUpdated: new Date().toISOString(),
      dataSource: "IANA Language Subtag Registry + ISO 3166-1",
    },
    scripts: {
      codes: [] as string[],
      total: 0,
      lastUpdated: new Date().toISOString(),
      dataSource: "IANA Language Subtag Registry + ISO 15924",
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
