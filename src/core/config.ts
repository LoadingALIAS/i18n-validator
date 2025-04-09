import type { LanguageData, RegionData, ScriptData } from "../types";

/**
 * Module state to hold loaded data
 */
const loadedLanguages = new Map<string, LanguageData>();
const loadedRegions = new Map<string, RegionData>();
const loadedScripts = new Map<string, ScriptData>();
const initializedRef = { value: false };

/**
 * Configuration options for loading data
 */
export interface ConfigureOptions {
  /**
   * Array of language codes to load
   * When provided, only these languages will be available for validation
   * When not provided, all available languages will be loaded
   */
  languages?: string[];

  /**
   * Array of region codes to load
   * When provided, only these regions will be available for validation
   * When not provided, all available regions will be loaded
   */
  regions?: string[];

  /**
   * Array of script codes to load
   * When provided, only these scripts will be available for validation
   * When not provided, all available scripts will be loaded
   */
  scripts?: string[];

  /**
   * Array of predefined groups to load (e.g., 'common-web', 'eu', 'cjk')
   * These will be merged with any explicitly provided codes
   */
  groups?: string[];

  /**
   * Custom data to use instead of loading from built-in data sources
   * Used for testing or when providing completely custom validation sets
   */
  customData?: {
    languages?: Record<string, LanguageData>;
    regions?: Record<string, RegionData>;
    scripts?: Record<string, ScriptData>;
  };
}

/**
 * Configure the validator by loading necessary data
 *
 * This must be called before using any validation functions.
 * It loads the required language, region, and script data
 * according to the provided options.
 *
 * @param options Configuration options specifying what data to load
 * @returns A promise that resolves when all data is loaded
 *
 * @example
 * // Load all available data
 * await configure();
 *
 * @example
 * // Load only specific languages and regions
 * await configure({
 *   languages: ['en', 'es', 'fr'],
 *   regions: ['US', 'ES', 'FR']
 * });
 *
 * @example
 * // Load using predefined groups
 * await configure({
 *   groups: ['common-web']
 * });
 */
export async function configure(options: ConfigureOptions = {}): Promise<void> {
  // Reset any existing data
  loadedLanguages.clear();
  loadedRegions.clear();
  loadedScripts.clear();
  initializedRef.value = false;

  try {
    // Handle custom data (primarily for testing)
    if (options.customData) {
      if (options.customData.languages) {
        for (const [code, data] of Object.entries(options.customData.languages)) {
          loadedLanguages.set(code, data);
        }
      }

      if (options.customData.regions) {
        for (const [code, data] of Object.entries(options.customData.regions)) {
          loadedRegions.set(code, data);
        }
      }

      if (options.customData.scripts) {
        for (const [code, data] of Object.entries(options.customData.scripts)) {
          loadedScripts.set(code, data);
        }
      }

      // Mark as initialized even with custom data
      initializedRef.value = true;
      return;
    }

    // Calculate codes to load from groups and explicitly provided codes
    const languagesToLoad = new Set<string>(options.languages || []);
    const regionsToLoad = new Set<string>(options.regions || []);
    const scriptsToLoad = new Set<string>(options.scripts || []);

    // Process groups, if provided
    if (options.groups && options.groups.length > 0) {
      await Promise.all(
        options.groups.map(async (groupName) => {
          try {
            // Import the group definition
            const groupData = await import(`../data/groups/${groupName}.json`);

            // Add group languages
            if (groupData.languages) {
              for (const code of groupData.languages) {
                languagesToLoad.add(code);
              }
            }

            // Add group regions
            if (groupData.regions) {
              for (const code of groupData.regions) {
                regionsToLoad.add(code);
              }
            }

            // Add group scripts
            if (groupData.scripts) {
              for (const code of groupData.scripts) {
                scriptsToLoad.add(code);
              }
            }
          } catch (error) {
            console.warn(`Failed to load group "${groupName}": ${error}`);
          }
        }),
      );
    }

    // Parallel fetch of manifests
    const [languagesManifest, regionsManifest, scriptsManifest] = await Promise.all([
      // If no specific languages are requested, load the manifest
      languagesToLoad.size === 0 && !options.languages
        ? import("../data/languages/index.json").catch((error) => {
            console.error(`Failed to load languages manifest: ${error}`);
            return { codes: [] };
          })
        : { codes: [] },

      // If no specific regions are requested, load the manifest
      regionsToLoad.size === 0 && !options.regions
        ? import("../data/regions/index.json").catch((error) => {
            console.error(`Failed to load regions manifest: ${error}`);
            return { codes: [] };
          })
        : { codes: [] },

      // If no specific scripts are requested, load the manifest
      scriptsToLoad.size === 0 && !options.scripts
        ? import("../data/scripts/index.json").catch((error) => {
            console.error(`Failed to load scripts manifest: ${error}`);
            return { codes: [] };
          })
        : { codes: [] },
    ]);

    // Add manifest codes if we need to load all
    if (languagesToLoad.size === 0 && !options.languages) {
      for (const code of languagesManifest.codes || []) {
        languagesToLoad.add(code);
      }
    }

    if (regionsToLoad.size === 0 && !options.regions) {
      for (const code of regionsManifest.codes || []) {
        regionsToLoad.add(code);
      }
    }

    if (scriptsToLoad.size === 0 && !options.scripts) {
      for (const code of scriptsManifest.codes || []) {
        scriptsToLoad.add(code);
      }
    }

    // Load individual data files in parallel
    const loadPromises: Promise<unknown>[] = [];

    // Load individual language files
    for (const code of languagesToLoad) {
      const normalizedCode = code.toLowerCase();
      loadPromises.push(
        import(`../data/languages/${normalizedCode}.json`)
          .then((data) => {
            loadedLanguages.set(normalizedCode, data as unknown as LanguageData);
          })
          .catch((error) => {
            console.warn(`Failed to load language "${code}": ${error}`);
          }),
      );
    }

    // Load individual region files
    for (const code of regionsToLoad) {
      const normalizedCode = code.toUpperCase();
      loadPromises.push(
        import(`../data/regions/${normalizedCode}.json`)
          .then((data) => {
            loadedRegions.set(normalizedCode, data as unknown as RegionData);
          })
          .catch((error) => {
            console.warn(`Failed to load region "${code}": ${error}`);
          }),
      );
    }

    // Load individual script files
    for (const code of scriptsToLoad) {
      // First character uppercase, rest lowercase
      const normalizedCode = code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
      loadPromises.push(
        import(`../data/scripts/${normalizedCode}.json`)
          .then((data) => {
            loadedScripts.set(normalizedCode, data as unknown as ScriptData);
          })
          .catch((error) => {
            console.warn(`Failed to load script "${code}": ${error}`);
          }),
      );
    }

    // Wait for all dynamic imports to complete
    await Promise.all(loadPromises);

    // Mark as initialized
    initializedRef.value = true;
  } catch (error) {
    throw new Error(`Failed to load validator data: ${error}`);
  }
}

/**
 * Check if the module has been initialized with data
 *
 * @returns True if data has been loaded with configure(), false otherwise
 */
export function isDataLoaded(): boolean {
  return initializedRef.value;
}

/**
 * Get the map of loaded languages
 *
 * @returns Map of language codes to language data
 * @throws Error if data is not loaded
 */
export function getLoadedLanguages(): Map<string, LanguageData> {
  if (!isDataLoaded()) {
    throw new Error("Data not loaded. Call configure() first.");
  }
  return loadedLanguages;
}

/**
 * Get the map of loaded regions
 *
 * @returns Map of region codes to region data
 * @throws Error if data is not loaded
 */
export function getLoadedRegions(): Map<string, RegionData> {
  if (!isDataLoaded()) {
    throw new Error("Data not loaded. Call configure() first.");
  }
  return loadedRegions;
}

/**
 * Get the map of loaded scripts
 *
 * @returns Map of script codes to script data
 * @throws Error if data is not loaded
 */
export function getLoadedScripts(): Map<string, ScriptData> {
  if (!isDataLoaded()) {
    throw new Error("Data not loaded. Call configure() first.");
  }
  return loadedScripts;
}

/**
 * Get data for a specific language code
 *
 * @param code The language code to look up
 * @returns The language data object or undefined if not found
 * @throws Error if data is not loaded
 */
export function getLanguageData(code: string): LanguageData | undefined {
  if (!initializedRef.value) {
    throw new Error("Data not loaded. Call configure() first.");
  }
  return loadedLanguages.get(code);
}

/**
 * Get data for a specific region code
 *
 * @param code The region code to look up
 * @returns The region data object or undefined if not found
 * @throws Error if data is not loaded
 */
export function getRegionData(code: string): RegionData | undefined {
  if (!initializedRef.value) {
    throw new Error("Data not loaded. Call configure() first.");
  }
  return loadedRegions.get(code);
}

/**
 * Get data for a specific script code
 *
 * @param code The script code to look up
 * @returns The script data object or undefined if not found
 * @throws Error if data is not loaded
 */
export function getScriptData(code: string): ScriptData | undefined {
  if (!initializedRef.value) {
    throw new Error("Data not loaded. Call configure() first.");
  }
  return loadedScripts.get(code);
}

/**
 * Reset the internal state - primarily for testing purposes
 * This clears all loaded data and resets the initialization state
 */
export function reset(): void {
  loadedLanguages.clear();
  loadedRegions.clear();
  loadedScripts.clear();
  initializedRef.value = false;
}
