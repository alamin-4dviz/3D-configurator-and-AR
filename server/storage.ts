import {
  type User,
  type InsertUser,
  type AdminModel,
  type InsertAdminModel,
  type ConfiguratorMetadata,
  type InsertConfiguratorMetadata,
  type ModelTexture,
  type InsertModelTexture,
  type TempUpload,
  type InsertTempUpload,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import { join } from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser, isAdmin?: boolean): Promise<User>;
  
  getAllAdminModels(): Promise<AdminModel[]>;
  getPublicAdminModels(): Promise<AdminModel[]>;
  getAdminModel(id: string): Promise<AdminModel | undefined>;
  createAdminModel(model: InsertAdminModel): Promise<AdminModel>;
  updateAdminModel(id: string, model: Partial<InsertAdminModel>): Promise<AdminModel | undefined>;
  deleteAdminModel(id: string): Promise<boolean>;
  
  getConfiguratorMetadata(modelId: string): Promise<ConfiguratorMetadata | undefined>;
  createConfiguratorMetadata(metadata: InsertConfiguratorMetadata): Promise<ConfiguratorMetadata>;
  updateConfiguratorMetadata(modelId: string, metadata: Partial<InsertConfiguratorMetadata>): Promise<ConfiguratorMetadata | undefined>;
  
  getModelTextures(modelId: string): Promise<ModelTexture[]>;
  createModelTexture(texture: InsertModelTexture): Promise<ModelTexture>;
  deleteModelTextures(modelId: string): Promise<boolean>;
  
  getTempUpload(id: string): Promise<TempUpload | undefined>;
  getTempUploadBySession(sessionId: string): Promise<TempUpload[]>;
  createTempUpload(upload: InsertTempUpload): Promise<TempUpload>;
  updateTempUpload(id: string, upload: Partial<InsertTempUpload>): Promise<TempUpload | undefined>;
  deleteTempUpload(id: string): Promise<boolean>;
  deleteTempUploadsBySession(sessionId: string): Promise<boolean>;
  getExpiredTempUploads(maxAge: number): Promise<TempUpload[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private adminModels: Map<string, AdminModel>;
  private configuratorMetadata: Map<string, ConfiguratorMetadata>;
  private modelTextures: Map<string, ModelTexture>;
  private tempUploads: Map<string, TempUpload>;
  private initialized: boolean = false;

  constructor() {
    this.users = new Map();
    this.adminModels = new Map();
    this.configuratorMetadata = new Map();
    this.modelTextures = new Map();
    this.tempUploads = new Map();
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    
    try {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const adminUser: User = {
        id: randomUUID(),
        username: "admin",
        password: hashedPassword,
        isAdmin: true,
      };
      this.users.set(adminUser.id, adminUser);
      console.log('Admin user initialized with password hash');
      
      // Load existing admin models from filesystem
      await this.loadAdminModelsFromDisk();
    } catch (error) {
      console.error('Error during storage initialization:', error);
      throw error;
    }
  }

  private async loadAdminModelsFromDisk(): Promise<void> {
    try {
      const adminModelsDir = join(process.cwd(), 'uploads', 'admin-models');
      
      // Check if directory exists
      try {
        await fs.access(adminModelsDir);
      } catch {
        // Directory doesn't exist yet, which is fine
        return;
      }
      
      const entries = await fs.readdir(adminModelsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const modelDir = join(adminModelsDir, entry.name);
        const metadataPath = join(modelDir, 'metadata.json');
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const model: AdminModel = JSON.parse(metadataContent);
          
          // Verify the model file still exists
          if (model.glbPath) {
            try {
              await fs.access(join(process.cwd(), model.glbPath));
              this.adminModels.set(model.id, model);
              console.log(`Loaded admin model from disk: ${model.id} - ${model.title}`);
            } catch {
              console.warn(`Model file not found, skipping: ${model.id}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to load metadata for ${entry.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading admin models from disk:', error);
      // Don't throw, just log the warning
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser, isAdmin: boolean = false): Promise<User> {
    await this.ensureInitialized();
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = { 
      id, 
      username: insertUser.username,
      password: hashedPassword,
      isAdmin, 
    };
    this.users.set(id, user);
    return user;
  }

  async getAllAdminModels(): Promise<AdminModel[]> {
    return Array.from(this.adminModels.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPublicAdminModels(): Promise<AdminModel[]> {
    return Array.from(this.adminModels.values())
      .filter((model) => model.visible)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAdminModel(id: string): Promise<AdminModel | undefined> {
    return this.adminModels.get(id);
  }

  async createAdminModel(insertModel: InsertAdminModel): Promise<AdminModel> {
    const id = randomUUID();
    const now = new Date();
    const model: AdminModel = {
      id,
      title: insertModel.title,
      description: insertModel.description ?? null,
      category: insertModel.category ?? "General",
      visible: insertModel.visible ?? true,
      glbPath: insertModel.glbPath,
      usdzPath: insertModel.usdzPath ?? null,
      thumbnailPath: insertModel.thumbnailPath ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.adminModels.set(id, model);
    
    // Save metadata to disk
    await this.saveModelMetadataToDisk(model);
    
    return model;
  }

  private async saveModelMetadataToDisk(model: AdminModel): Promise<void> {
    try {
      const adminModelsDir = join(process.cwd(), 'uploads', 'admin-models');
      const modelDir = join(adminModelsDir, model.id);
      
      // Ensure directory exists
      await fs.mkdir(modelDir, { recursive: true });
      
      // Write metadata.json
      const metadataPath = join(modelDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(model, null, 2), 'utf-8');
      
      console.log(`Saved admin model metadata: ${model.id}`);
    } catch (error) {
      console.error(`Failed to save model metadata for ${model.id}:`, error);
      // Don't throw, just log - the model is still in memory
    }
  }

  async updateAdminModel(id: string, updates: Partial<InsertAdminModel>): Promise<AdminModel | undefined> {
    const model = this.adminModels.get(id);
    if (!model) return undefined;
    
    const updatedModel: AdminModel = {
      ...model,
      title: updates.title ?? model.title,
      description: updates.description !== undefined ? updates.description : model.description,
      category: updates.category ?? model.category,
      visible: updates.visible !== undefined ? updates.visible : model.visible,
      glbPath: updates.glbPath ?? model.glbPath,
      usdzPath: updates.usdzPath !== undefined ? updates.usdzPath : model.usdzPath,
      thumbnailPath: updates.thumbnailPath !== undefined ? updates.thumbnailPath : model.thumbnailPath,
      updatedAt: new Date(),
    };
    this.adminModels.set(id, updatedModel);
    
    // Save updated metadata to disk
    await this.saveModelMetadataToDisk(updatedModel);
    
    return updatedModel;
  }

  async deleteAdminModel(id: string): Promise<boolean> {
    const deleted = this.adminModels.delete(id);
    if (deleted) {
      Array.from(this.configuratorMetadata.entries())
        .filter(([_, meta]) => meta.modelId === id)
        .forEach(([key]) => this.configuratorMetadata.delete(key));
      Array.from(this.modelTextures.entries())
        .filter(([_, texture]) => texture.modelId === id)
        .forEach(([key]) => this.modelTextures.delete(key));
    }
    return deleted;
  }

  async getConfiguratorMetadata(modelId: string): Promise<ConfiguratorMetadata | undefined> {
    return Array.from(this.configuratorMetadata.values()).find(
      (meta) => meta.modelId === modelId
    );
  }

  async createConfiguratorMetadata(insertMeta: InsertConfiguratorMetadata): Promise<ConfiguratorMetadata> {
    const id = randomUUID();
    const metadata: ConfiguratorMetadata = {
      id,
      modelId: insertMeta.modelId,
      parts: insertMeta.parts ?? [],
      textures: insertMeta.textures ?? {},
      materials: insertMeta.materials ?? {},
      colors: insertMeta.colors ?? [],
    };
    this.configuratorMetadata.set(id, metadata);
    return metadata;
  }

  async updateConfiguratorMetadata(
    modelId: string,
    updates: Partial<InsertConfiguratorMetadata>
  ): Promise<ConfiguratorMetadata | undefined> {
    const existing = await this.getConfiguratorMetadata(modelId);
    if (!existing) return undefined;
    
    const updated: ConfiguratorMetadata = {
      ...existing,
      parts: updates.parts ?? existing.parts,
      textures: updates.textures ?? existing.textures,
      materials: updates.materials ?? existing.materials,
      colors: updates.colors ?? existing.colors,
    };
    this.configuratorMetadata.set(existing.id, updated);
    return updated;
  }

  async getModelTextures(modelId: string): Promise<ModelTexture[]> {
    return Array.from(this.modelTextures.values()).filter(
      (texture) => texture.modelId === modelId
    );
  }

  async createModelTexture(insertTexture: InsertModelTexture): Promise<ModelTexture> {
    const id = randomUUID();
    const texture: ModelTexture = {
      id,
      modelId: insertTexture.modelId,
      name: insertTexture.name,
      type: insertTexture.type,
      filePath: insertTexture.filePath,
      createdAt: new Date(),
    };
    this.modelTextures.set(id, texture);
    return texture;
  }

  async deleteModelTextures(modelId: string): Promise<boolean> {
    const textures = await this.getModelTextures(modelId);
    textures.forEach((texture) => this.modelTextures.delete(texture.id));
    return true;
  }

  async getTempUpload(id: string): Promise<TempUpload | undefined> {
    return this.tempUploads.get(id);
  }

  async getTempUploadBySession(sessionId: string): Promise<TempUpload[]> {
    return Array.from(this.tempUploads.values()).filter(
      (upload) => upload.sessionId === sessionId
    );
  }

  async createTempUpload(insertUpload: InsertTempUpload): Promise<TempUpload> {
    const id = randomUUID();
    const upload: TempUpload = {
      id,
      sessionId: insertUpload.sessionId,
      originalFileName: insertUpload.originalFileName,
      originalPath: insertUpload.originalPath,
      glbPath: insertUpload.glbPath ?? null,
      usdzPath: insertUpload.usdzPath ?? null,
      deviceType: insertUpload.deviceType,
      status: insertUpload.status ?? "pending",
      createdAt: new Date(),
    };
    this.tempUploads.set(id, upload);
    return upload;
  }

  async updateTempUpload(id: string, updates: Partial<InsertTempUpload>): Promise<TempUpload | undefined> {
    const upload = this.tempUploads.get(id);
    if (!upload) return undefined;
    
    const updated: TempUpload = {
      ...upload,
      glbPath: updates.glbPath !== undefined ? updates.glbPath ?? null : upload.glbPath,
      usdzPath: updates.usdzPath !== undefined ? updates.usdzPath ?? null : upload.usdzPath,
      status: updates.status ?? upload.status,
    };
    this.tempUploads.set(id, updated);
    return updated;
  }

  async deleteTempUpload(id: string): Promise<boolean> {
    return this.tempUploads.delete(id);
  }

  async deleteTempUploadsBySession(sessionId: string): Promise<boolean> {
    const uploads = await this.getTempUploadBySession(sessionId);
    uploads.forEach((upload) => this.tempUploads.delete(upload.id));
    return true;
  }

  async getExpiredTempUploads(maxAge: number): Promise<TempUpload[]> {
    const now = Date.now();
    return Array.from(this.tempUploads.values()).filter(
      (upload) => now - new Date(upload.createdAt).getTime() > maxAge
    );
  }
}

export const storage = new MemStorage();
