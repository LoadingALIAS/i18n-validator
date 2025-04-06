/** Core types: LanguageData, RegionData, NormalizedResult */
export type LanguageData = {
  name: string;
  native: string;
  iso639_1: string;
  iso639_2: string;
  iso639_3: string;
  bcp47: string;
  region?: string;
  script?: string;
  aliases: string[];
};

export type RegionData = {
  name: string;
  alpha2: string;
  alpha3: string;
  numeric: string;
  aliases: string[];
};

export type NormalizedResult<T> = T | null;
