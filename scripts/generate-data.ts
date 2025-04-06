// scripts/generate-data.ts
import axios from "axios";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { LanguageData, RegionData } from "../src/types";

const OUT_LANG = join(process.cwd(), "src/languages");
const OUT_REGION = join(process.cwd(), "src/regions");

const ISO639_2_URL =
  "https://raw.githubusercontent.com/mamantoha/iso_codes/main/data/iso_639-2.json";
const ISO639_3_URL =
  "https://raw.githubusercontent.com/bbenno/languages/master/data/iso-639-3.tsv";
const ISO3166_URL =
  "https://raw.githubusercontent.com/mamantoha/iso_codes/main/data/iso_3166-1.json";

interface ISO639_2_Entry {
  alpha_2?: string;
  alpha_3: string;
  name: string;
}

interface ISO3166_Entry {
  alpha_2: string;
  alpha_3: string;
  flag: string;
  name: string;
  numeric: string;
  official_name?: string;
}

async function fetchISO639Data(): Promise<Record<string, LanguageData>> {
  const [{ data: iso2Data }, { data: iso3Raw }] = await Promise.all([
    axios.get<{ "639-2": ISO639_2_Entry[] }>(ISO639_2_URL),
    axios.get<string>(ISO639_3_URL),
  ]);

  const iso2Map = new Map<string, ISO639_2_Entry>();
  for (const entry of iso2Data["639-2"]) {
    if (entry.alpha_2) {
      iso2Map.set(entry.alpha_2.toLowerCase(), entry);
    }
  }

  const lines = iso3Raw.split("\n").slice(1); // skip header
  const languageMap: Record<string, LanguageData> = {};

  for (const line of lines) {
    const [id, part2b, part2t, part1, , , refName] = line.split("\t");
    const iso639_1 = part1?.toLowerCase();
    const iso639_2 = part2b || part2t || id;
    const iso639_3 = id;

    const name = refName || iso639_1 || iso639_3;
    const aliasList = [name.toLowerCase(), iso639_1, iso639_2, iso639_3].filter(
      Boolean,
    ) as string[];

    if (iso639_1) {
      const iso2Entry = iso2Map.get(iso639_1);
      languageMap[iso639_1] = {
        name,
        native: iso2Entry?.name || name,
        iso639_1,
        iso639_2,
        iso639_3,
        bcp47: iso639_1,
        script: undefined,
        region: undefined,
        aliases: Array.from(new Set(aliasList)),
      };
    }
  }

  return languageMap;
}

async function fetchRegionData(): Promise<Record<string, RegionData>> {
  const { data } = await axios.get<{ "3166-1": ISO3166_Entry[] }>(ISO3166_URL);
  const regionMap: Record<string, RegionData> = {};

  for (const entry of data["3166-1"]) {
    const alpha2 = entry.alpha_2.toUpperCase();
    regionMap[alpha2] = {
      name: entry.name,
      alpha2,
      alpha3: entry.alpha_3,
      numeric: entry.numeric,
      aliases: [
        entry.name.toLowerCase(),
        entry.alpha_2.toLowerCase(),
        entry.alpha_3.toLowerCase(),
        entry.numeric,
      ],
    };
  }

  return regionMap;
}

async function writeLanguages(languages: Record<string, LanguageData>) {
  await mkdir(OUT_LANG, { recursive: true });
  const entries = Object.entries(languages);

  for (const [key, lang] of entries) {
    const fileName = lang.iso639_1;
    const content = `import type { LanguageData } from '../types';

export const ${fileName}: LanguageData = ${JSON.stringify(lang, null, 2)};
`;
    await writeFile(join(OUT_LANG, `${fileName}.ts`), content, "utf-8");
  }

  const imports = entries
    .map(([key]) => `import { ${key} } from './${key}';`)
    .join("\n");
  const list = `export const languages = [${entries.map(([key]) => key).join(", ")}];`;
  await writeFile(join(OUT_LANG, `db.ts`), `${imports}\n\n${list}\n`, "utf-8");
}

async function writeRegions(regions: Record<string, RegionData>) {
  await mkdir(OUT_REGION, { recursive: true });
  const entries = Object.entries(regions);

  for (const [key, region] of entries) {
    const fileName = region.alpha2.toUpperCase();
    const content = `import type { RegionData } from '../types';

export const ${fileName}: RegionData = ${JSON.stringify(region, null, 2)};
`;
    await writeFile(join(OUT_REGION, `${fileName}.ts`), content, "utf-8");
  }

  const imports = entries
    .map(([key]) => `import { ${key} } from './${key}';`)
    .join("\n");
  const list = `export const regions = [${entries.map(([key]) => key).join(", ")}];`;
  await writeFile(
    join(OUT_REGION, `db.ts`),
    `${imports}\n\n${list}\n`,
    "utf-8",
  );
}

async function main() {
  console.log("🌐 Fetching language and region data...");
  const [languages, regions] = await Promise.all([
    fetchISO639Data(),
    fetchRegionData(),
  ]);
  await writeLanguages(languages);
  await writeRegions(regions);
  console.log("✅ All data files generated.");
}

main().catch((err) => {
  console.error("❌ Generation failed:", err);
});
