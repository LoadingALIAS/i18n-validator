import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

async function verifyJsonFile(filePath: string) {
  const relativePath = filePath.split("src/data/")[1];
  console.log(`\nVerifying ${relativePath}...`);

  try {
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    // Verify it's an object
    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Expected root to be an object/map");
    }

    console.log("✓ File is valid JSON");
    console.log("✓ Root is an object with expected structure");
    return true;
  } catch (error: unknown) {
    console.error("✗ Error:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function verifyDirectory(dirPath: string): Promise<boolean> {
  const dirName = dirPath.split("src/data/")[1];
  console.log(`\nVerifying directory: ${dirName}`);

  try {
    const files = await readdir(dirPath);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    // For groups directory, verify all group files
    if (dirName === "groups") {
      console.log(`Found ${jsonFiles.length} group files, verifying all...`);
      let success = true;
      for (const file of jsonFiles) {
        success = (await verifyJsonFile(join(dirPath, file))) && success;
      }
      return success;
    }

    // For other directories, verify the manifest first
    const manifestPath = join(dirPath, "index.json");
    const manifestSuccess = await verifyJsonFile(manifestPath);

    if (!manifestSuccess) {
      return false;
    }

    // Filter out index.json for the sample checks
    const individualFiles = jsonFiles.filter((f) => f !== "index.json");

    // Take first, middle, and last file as samples
    const samplesToCheck = [
      individualFiles[0],
      individualFiles[Math.floor(individualFiles.length / 2)],
      individualFiles[individualFiles.length - 1],
    ].filter(Boolean);

    console.log(`Found ${individualFiles.length} files, checking ${samplesToCheck.length} samples...`);

    let success = true;
    for (const file of samplesToCheck) {
      success = (await verifyJsonFile(join(dirPath, file))) && success;
    }

    return success;
  } catch (error: unknown) {
    console.error("✗ Error:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  console.log("Verifying generated JSON files...");

  const baseDir = join(process.cwd(), "src", "data");
  const directories = ["languages", "regions", "scripts", "groups"];
  let success = true;

  for (const dir of directories) {
    success = (await verifyDirectory(join(baseDir, dir))) && success;
  }

  if (!success) {
    console.error("\n❌ Verification failed");
    process.exit(1);
  }

  console.log("\n✅ All files verified successfully");
}

main().catch(console.error);
