// scripts/generate-data.ts
import axios from "axios";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { LanguageData, RegionData, ScriptData } from "../src/types";

// Output directories
const OUT_LANG = join(process.cwd(), "src/data/languages");
const OUT_REGION = join(process.cwd(), "src/data/regions");
const OUT_SCRIPT = join(process.cwd(), "src/data/scripts");

// Data source URLs - consolidated in one place for easier maintenance
const DATA_SOURCES = {
  // Primary sources
  IANA_REGISTRY: "https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry",
  
  // ISO 639 (languages)
  ISO639_2: "https://raw.githubusercontent.com/mamantoha/iso_codes/main/data/iso_639-2.json",
  ISO639_3: "https://raw.githubusercontent.com/bbenno/languages/master/data/iso-639-3.tsv",
  
  // ISO 3166 (regions)
  ISO3166: "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json",
  
  // ISO 15924 (scripts) - already included in IANA but we might add supplementary data
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
  'Suppress-Script'?: string;
  Scope?: string;
  Macrolanguage?: string;
  'Preferred-Value'?: string;
}

interface ISO3166Entry {
  name: string;
  'alpha-2': string;
  'alpha-3': string;
  'country-code': string;
}

async function getISO3166Data(): Promise<Record<string, ISO3166Entry>> {
  try {
    const response = await fetch(DATA_SOURCES.ISO3166);
    const data = await response.json() as ISO3166Entry[];
    return data.reduce((acc, entry) => {
      acc[entry['alpha-2']] = entry;
      return acc;
    }, {} as Record<string, ISO3166Entry>);
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
  const entries = content.split('%%').slice(1); // Skip file date
  const languages: Record<string, LanguageData> = {};
  const regions: Record<string, RegionData> = {};
  const scripts: Record<string, ScriptData> = {};
  const iso3166Data = await getISO3166Data();

  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    const data: Partial<IANAEntry> = {};
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(': ');
      const value = valueParts.join(': ').trim();
      
      if (key === 'Description') {
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
      case 'language':
        if (data.Subtag.length === 2) { // ISO 639-1 codes
          languages[data.Subtag] = {
            name: data.Description?.[0] || '',
            native: data.Description?.[0] || '',
            iso639_1: data.Subtag,
            iso639_2: '', // Will be filled from ISO639-2 data
            iso639_3: '', // Will be filled from ISO639-3 data
            bcp47: data.Subtag,
            suppressScript: data['Suppress-Script'],
            scope: data.Scope as 'macrolanguage' | 'collection' | 'special' | undefined,
            aliases: [...(data.Description || [])].map(d => d.toLowerCase()),
            added: data.Added || '',
          };
        }
        break;

      case 'region':
        if (!data.Subtag) continue;
        
        if (data.Subtag.length === 2) { // ISO 3166-1 codes
          const alpha2 = data.Subtag.toUpperCase();
          const descriptions = Array.isArray(data.Description) ? data.Description : [data.Description];
          const aliases = descriptions
            .filter((d): d is string => typeof d === 'string')
            .map(d => d.toLowerCase());

          const iso3166Entry = iso3166Data[alpha2];
          regions[alpha2] = {
            name: descriptions[0] || '',
            alpha2,
            alpha3: iso3166Entry?.['alpha-3'] || '',
            numeric: iso3166Entry?.['country-code'] || '',
            aliases: [
              ...aliases,
              alpha2.toLowerCase(),
            ],
            added: data.Added || '',
          };
        }
        break;

      case 'script':
        if (data.Subtag.length === 4) { // ISO 15924 codes
          scripts[data.Subtag] = {
            name: data.Description?.[0] || '',
            code: data.Subtag,
            numeric: '', // Will be filled if available
            aliases: [...(data.Description || [])].map(d => d.toLowerCase()),
            added: data.Added || '',
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
      const [id, part2b, part2t, part1] = line.split("\t");
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

async function writeLanguages(languages: Record<string, LanguageData>) {
  await mkdir(OUT_LANG, { recursive: true });
  const entries = Object.entries(languages);

  // Write individual language files
  for (const [key, lang] of entries) {
    const content = `import type { LanguageData } from '../../types';

const data: LanguageData = ${JSON.stringify(lang, null, 2)};
export default data;
`;
    await writeFile(join(OUT_LANG, `${key}.ts`), content, "utf-8");
  }

  // Generate the db.ts file using a Map
  const imports = entries
    .map(([key]) => `import ${key}Data from './${key}';`)
    .join("\n");
  
  const mapContent = entries
    .map(([key]) => `  ['${key}', ${key}Data]`)
    .join(",\n");

  const dbContent = `${imports}

// Use a Map to avoid issues with reserved words
export const languageMap = new Map<string, LanguageData>([
${mapContent}
]);

export const languages = Array.from(languageMap.values());
`;
  await writeFile(join(OUT_LANG, `db.ts`), dbContent, "utf-8");
}

async function writeRegions(regions: Record<string, RegionData>) {
  await mkdir(OUT_REGION, { recursive: true });
  const entries = Object.entries(regions);

  // Write individual region files
  for (const [key, region] of entries) {
    const content = `import type { RegionData } from '../../types';

const data: RegionData = ${JSON.stringify(region, null, 2)};
export default data;
`;
    await writeFile(join(OUT_REGION, `${key}.ts`), content, "utf-8");
  }

  // Generate the db.ts file using a Map
  const imports = entries
    .map(([key]) => `import ${key}Data from './${key}';`)
    .join("\n");
  
  const mapContent = entries
    .map(([key]) => `  ['${key}', ${key}Data]`)
    .join(",\n");

  const dbContent = `${imports}

// Use a Map to avoid issues with reserved words
export const regionMap = new Map<string, RegionData>([
${mapContent}
]);

export const regions = Array.from(regionMap.values());
`;
  await writeFile(join(OUT_REGION, `db.ts`), dbContent, "utf-8");
}

async function writeScripts(scripts: Record<string, ScriptData>) {
  await mkdir(OUT_SCRIPT, { recursive: true });
  const entries = Object.entries(scripts);

  // Write individual script files
  for (const [key, script] of entries) {
    const content = `import type { ScriptData } from '../../types';

const data: ScriptData = ${JSON.stringify(script, null, 2)};
export default data;
`;
    await writeFile(join(OUT_SCRIPT, `${key}.ts`), content, "utf-8");
  }

  // Generate the db.ts file using a Map
  const imports = entries
    .map(([key]) => `import ${key}Data from './${key}';`)
    .join("\n");
  
  const mapContent = entries
    .map(([key]) => `  ['${key}', ${key}Data]`)
    .join(",\n");

  const dbContent = `${imports}

// Use a Map to avoid issues with reserved words
export const scriptMap = new Map<string, ScriptData>([
${mapContent}
]);

export const scripts = Array.from(scriptMap.values());
`;
  await writeFile(join(OUT_SCRIPT, `db.ts`), dbContent, "utf-8");
}

async function main() {
  try {
    console.log("🌐 Fetching IANA language subtag registry...");
    const { data: ianaRegistry } = await axios.get<string>(DATA_SOURCES.IANA_REGISTRY);
    
    console.log("📝 Parsing IANA registry data...");
    const { languages: ianaLanguages, regions, scripts } = await parseIANARegistry(ianaRegistry);
    
    console.log("🔄 Enriching with ISO-639-2/3 data...");
    const languages = await fetchISO639Data(ianaLanguages);

    console.log("💾 Writing data files...");
    await Promise.all([
      writeLanguages(languages),
      writeRegions(regions),
      writeScripts(scripts)
    ]);

    console.log("✅ All data files generated.");
  } catch (error) {
    console.error("❌ Generation failed:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Generation failed:", err);
  process.exit(1);
});
