import axios from "axios";
import { writeFile } from "node:fs/promises";
import languages from "./data/languages.json";
import type { Language } from "./types";

async function updateLanguages() {
  try {
    const response = await axios.get(
      "https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3.tab",
    );
    console.log("Fetched ISO-639-3 data:", response.data.slice(0, 100));

    await writeFile(
      "src/data/languages.json",
      JSON.stringify(languages, null, 2),
    );

    console.log("Successfully updated languages.json");
  } catch (error) {
    console.error("Error updating languages:", error);
    throw error;
  }
}

updateLanguages().catch(console.error);
