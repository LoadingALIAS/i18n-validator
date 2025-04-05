export interface Language {
  name: string;
  iso6391: string;
  iso6392: string;
  iso6393: string;
  regions: string[];
}

export interface Country {
  alpha2: string;
  alpha3: string;
  numeric: string;
  currency: string;
}

export interface Locale {
  language: string;
  region?: string;
}
