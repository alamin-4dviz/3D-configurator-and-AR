import { promises as fs } from "fs";
import { join } from "path";

/**
 * Migration script to create metadata.json for existing admin models
 * Run this once to recover models uploaded before persistence was added
 */
async function migrateAdminModels() {
  try {
    const adminModelsDir = join(process.cwd(), "uploads", "admin-models");

    console.log("Starting admin models migration...");
    console.log("Looking in:", adminModelsDir);

    try {
      await fs.access(adminModelsDir);
    } catch {
      console.log("No admin models directory found. Nothing to migrate.");
      return;
    }

    const entries = await fs.readdir(adminModelsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const modelDir = join(adminModelsDir, entry.name);
      const metadataPath = join(modelDir, "metadata.json");

      // Check if metadata already exists
      try {
        await fs.access(metadataPath);
        console.log(`✓ Metadata already exists for: ${entry.name}`);
        continue;
      } catch {
        // Metadata doesn't exist, create it
      }

      // Find the GLB file
      const files = await fs.readdir(modelDir);
      const glbFile = files.find((f) => f.endsWith(".glb"));

      if (!glbFile) {
        console.log(`⚠ No GLB file found in: ${entry.name}`);
        continue;
      }

      // Extract filename without timestamp prefix for title
      const titleMatch = glbFile.match(/_(.+)\.glb$/);
      const title = titleMatch ? titleMatch[1] : entry.name;

      // Create metadata
      const now = new Date();
      const metadata = {
        id: entry.name,
        title,
        description: null,
        category: "General",
        visible: true,
        glbPath: `uploads/admin-models/${entry.name}/${glbFile}`,
        usdzPath: null,
        thumbnailPath: null,
        createdAt: now,
        updatedAt: now,
      };

      // Write metadata.json
      await fs.writeFile(
        metadataPath,
        JSON.stringify(metadata, null, 2),
        "utf-8"
      );

      console.log(`✓ Created metadata for: ${entry.name} (${title})`);
    }

    console.log("\n✅ Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateAdminModels();
