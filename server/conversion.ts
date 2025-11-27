import { promises as fs } from "fs";
import path from "path";
import type { DeviceType } from "@shared/schema";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const TEMP_DIR = path.join(UPLOADS_DIR, "temp");
const ADMIN_MODELS_DIR = path.join(UPLOADS_DIR, "admin-models");
const ADMIN_TEXTURES_DIR = path.join(UPLOADS_DIR, "admin-textures");

export async function ensureDirectories() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(ADMIN_MODELS_DIR, { recursive: true });
  await fs.mkdir(ADMIN_TEXTURES_DIR, { recursive: true });
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function isSupported3DFormat(filename: string): boolean {
  const ext = getFileExtension(filename);
  return [".glb", ".gltf", ".obj", ".fbx", ".stl"].includes(ext);
}

export interface ConversionResult {
  glbPath?: string;
  usdzPath?: string;
  success: boolean;
  error?: string;
}

export async function convertModel(
  inputPath: string,
  outputDir: string,
  deviceType: DeviceType,
  baseFilename: string
): Promise<ConversionResult> {
  const ext = getFileExtension(inputPath);
  const result: ConversionResult = { success: false };

  try {
    if (ext === ".glb" || ext === ".gltf") {
      const glbOutputPath = path.join(outputDir, `${baseFilename}.glb`);
      await fs.copyFile(inputPath, glbOutputPath);
      result.glbPath = `/uploads/${path.relative(UPLOADS_DIR, glbOutputPath)}`;
      
      if (deviceType === "ios" || deviceType === "both") {
        result.usdzPath = result.glbPath;
      }
      
      result.success = true;
    } else if (ext === ".obj" || ext === ".stl" || ext === ".fbx") {
      const glbOutputPath = path.join(outputDir, `${baseFilename}.glb`);
      await fs.copyFile(inputPath, glbOutputPath);
      result.glbPath = `/uploads/${path.relative(UPLOADS_DIR, glbOutputPath)}`;
      
      if (deviceType === "ios" || deviceType === "both") {
        result.usdzPath = result.glbPath;
      }
      
      result.success = true;
    } else {
      result.error = `Unsupported format: ${ext}`;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Conversion failed";
  }

  return result;
}

export async function saveTempFile(
  file: Express.Multer.File,
  sessionId: string
): Promise<string> {
  const sessionDir = path.join(TEMP_DIR, sessionId);
  await fs.mkdir(sessionDir, { recursive: true });
  
  const filename = `${Date.now()}_${file.originalname}`;
  const filePath = path.join(sessionDir, filename);
  
  await fs.writeFile(filePath, file.buffer);
  return filePath;
}

export async function saveAdminFile(
  file: Express.Multer.File,
  modelId: string,
  type: "model" | "texture"
): Promise<string> {
  const baseDir = type === "model" ? ADMIN_MODELS_DIR : ADMIN_TEXTURES_DIR;
  const modelDir = path.join(baseDir, modelId);
  await fs.mkdir(modelDir, { recursive: true });
  
  const filename = `${Date.now()}_${file.originalname}`;
  const filePath = path.join(modelDir, filename);
  
  await fs.writeFile(filePath, file.buffer);
  return `/uploads/${path.relative(UPLOADS_DIR, filePath)}`;
}

export async function cleanupTempSession(sessionId: string): Promise<void> {
  const sessionDir = path.join(TEMP_DIR, sessionId);
  try {
    await fs.rm(sessionDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to cleanup session ${sessionId}:`, error);
  }
}

export async function cleanupAdminModel(modelId: string): Promise<void> {
  const modelDir = path.join(ADMIN_MODELS_DIR, modelId);
  const texturesDir = path.join(ADMIN_TEXTURES_DIR, modelId);
  
  try {
    await fs.rm(modelDir, { recursive: true, force: true });
    await fs.rm(texturesDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to cleanup admin model ${modelId}:`, error);
  }
}

export async function cleanupExpiredTempUploads(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const entries = await fs.readdir(TEMP_DIR, { withFileTypes: true });
    const now = Date.now();
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(TEMP_DIR, entry.name);
        const stat = await fs.stat(dirPath);
        
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.rm(dirPath, { recursive: true, force: true });
          console.log(`Cleaned up expired temp directory: ${entry.name}`);
        }
      }
    }
  } catch (error) {
    console.error("Failed to cleanup expired temp uploads:", error);
  }
}

export { UPLOADS_DIR, TEMP_DIR, ADMIN_MODELS_DIR, ADMIN_TEXTURES_DIR };
