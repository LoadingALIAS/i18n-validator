// Generates JSON data files from IANA registry and ISO sources
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import axios from "axios";
import type { LanguageData, RegionData, ScriptData } from "../src/types";

// Output Files
const OUT_DIR = join(process.cwd(), "src/data");
const OUT_LANGUAGES = join(OUT_DIR, "languages.json");
const OUT_REGIONS = join(OUT_DIR, "regions.json");
const OUT_SCRIPTS = join(OUT_DIR, "scripts.json");

// Data source URLs
const DATA_SOURCES = {
  // Primary sources
  IANA_REGISTRY: "https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry",

  // ISO 639 (languages)
  ISO639_2: "https://raw.githubusercontent.com/mamantoha/iso_codes/main/data/iso_639-2.json",
  ISO639_3: "https://raw.githubusercontent.com/bbenno/languages/master/data/iso-639-3.tsv",

  // ISO 3166 (regions)
  ISO3166: "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json",

  // ISO 15924 (scripts) - supplementary
  ISO15924: "https://www.unicode.org/iso15924/iso15924.txt",
};

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
          // ISO 639-1 codes
          const descriptions = Array.isArray(data.Description) ? data.Description : [data.Description || ""];
          languages[data.Subtag] = {
            name: descriptions[0] || "",
            iso639_1: data.Subtag,
            iso639_2: "", // Will be filled from ISO639-2 data
            iso639_3: "", // Will be filled from ISO639-3 data
            suppressScript: data["Suppress-Script"],
            scope: data.Scope as "macrolanguage" | "collection" | "special" | undefined,
            aliases: [...descriptions].map((d) => d.toLowerCase()),
          };
        }
        break;

      case "region":
        if (!data.Subtag) continue;

        if (data.Subtag.length === 2) {
          // ISO 3166-1 codes
          const alpha2 = data.Subtag.toUpperCase();
          // Skip private use regions
          if (alpha2 === "AA" || alpha2 === "ZZ") continue;

          const descriptions = Array.isArray(data.Description) ? data.Description : [data.Description];
          const aliases = descriptions.filter((d): d is string => typeof d === "string").map((d) => d.toLowerCase());

          const iso3166Entry = iso3166Data[alpha2];
          regions[alpha2] = {
            name: descriptions[0] || "",
            alpha2,
            alpha3: iso3166Entry?.["alpha-3"] || "",
            numeric: iso3166Entry?.["country-code"] || "",
            aliases: [...aliases, alpha2.toLowerCase()],
          };
        }
        break;

      case "script":
        if (data.Subtag.length === 4) {
          // ISO 15924 codes
          scripts[data.Subtag] = {
            name: data.Description?.[0] || "",
            code: data.Subtag,
            aliases: [...(data.Description || [])].map((d) => d.toLowerCase()),
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
        }
      }
    }

    return existingLanguages;
  } catch (error) {
    console.error("Error fetching ISO 639 data:", error);
    return existingLanguages;
  }
}

async function writeData(data: {
  languages: Record<string, LanguageData>;
  regions: Record<string, RegionData>;
  scripts: Record<string, ScriptData>;
}) {
  await mkdir(OUT_DIR, { recursive: true });

  // Write each data file
  await Promise.all([
    writeFile(OUT_LANGUAGES, JSON.stringify(data.languages, null, 2), "utf-8"),
    writeFile(OUT_REGIONS, JSON.stringify(data.regions, null, 2), "utf-8"),
    writeFile(OUT_SCRIPTS, JSON.stringify(data.scripts, null, 2), "utf-8"),
  ]);

  // Log stats
  console.log("Data generation complete!");
  console.log("Statistics:");
  console.log(`- Languages: ${Object.keys(data.languages).length} entries`);
  console.log(`- Regions: ${Object.keys(data.regions).length} entries`);
  console.log(`- Scripts: ${Object.keys(data.scripts).length} entries`);
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

    console.log("Writing data files...");
    await writeData(data);
  } catch (error) {
    console.error("Error generating data:", error);
    process.exit(1);
  }
}

// Run the script
main();
