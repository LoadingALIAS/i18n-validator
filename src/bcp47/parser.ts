/**Split zh-Hant-HK into parts */
export function parseBCP47(tag: string) {
  const [language, scriptOrRegion, regionMaybe] = tag.split("-");
  const result: { language: string; script?: string; region?: string } = {
    language,
  };
  if (scriptOrRegion?.length === 4) result.script = scriptOrRegion;
  else if (scriptOrRegion) result.region = scriptOrRegion;
  if (regionMaybe) result.region = regionMaybe;
  return result;
}
