import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function verifyJsonFile(filename: string) {
  console.log(`\nVerifying ${filename}...`);
  const filePath = join(process.cwd(), "src", "data", filename);

  try {
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    // Verify it's an object
    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Expected root to be an object/map");
    }

    // Basic structure checks
    const sampleKey = Object.keys(data)[0];
    const sampleValue = data[sampleKey];

    console.log("✓ File is valid JSON");
    console.log(`✓ Root is an object with ${Object.keys(data).length} entries`);
    console.log(`Sample entry (${sampleKey}):`, JSON.stringify(sampleValue, null, 2));

    return true;
  } catch (error: unknown) {
    console.error("✗ Error:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  console.log("Verifying generated JSON files...");

  const files = ["languages.json", "regions.json", "scripts.json"];
  let success = true;

  for (const file of files) {
    success = (await verifyJsonFile(file)) && success;
  }

  if (!success) {
    console.error("\n❌ Verification failed");
    process.exit(1);
  }

  console.log("\n✅ All files verified successfully");
}

main().catch(console.error);
