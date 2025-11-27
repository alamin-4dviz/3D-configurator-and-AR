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
    
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: hashedPassword,
      isAdmin: true,
    };
    this.users.set(adminUser.id, adminUser);
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
    return model;
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
