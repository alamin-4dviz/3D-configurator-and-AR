import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  isAdmin: z.boolean().default(false),
});

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

export const adminModelSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().default("general"),
  visible: z.boolean().default(true),
  glbPath: z.string(),
  usdzPath: z.string().nullable(),
  thumbnailPath: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertAdminModelSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().optional().default("General"),
  visible: z.boolean().optional().default(true),
  glbPath: z.string(),
  usdzPath: z.string().nullable().optional(),
  thumbnailPath: z.string().nullable().optional(),
});

export type InsertAdminModel = z.infer<typeof insertAdminModelSchema>;
export type AdminModel = z.infer<typeof adminModelSchema>;

export const configuratorMetadataSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  parts: z.array(z.string()).default([]),
  textures: z.record(z.array(z.string())).default({}),
  materials: z.record(z.array(z.string())).default({}),
  colors: z.array(z.string()).default([]),
});

export const insertConfiguratorMetadataSchema = z.object({
  modelId: z.string(),
  parts: z.array(z.string()).optional().default([]),
  textures: z.record(z.array(z.string())).optional().default({}),
  materials: z.record(z.array(z.string())).optional().default({}),
  colors: z.array(z.string()).optional().default([]),
});

export type InsertConfiguratorMetadata = z.infer<typeof insertConfiguratorMetadataSchema>;
export type ConfiguratorMetadata = z.infer<typeof configuratorMetadataSchema>;

export const modelTextureSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  name: z.string(),
  type: z.string(),
  filePath: z.string(),
  createdAt: z.date(),
});

export const insertModelTextureSchema = z.object({
  modelId: z.string(),
  name: z.string(),
  type: z.string(),
  filePath: z.string(),
});

export type InsertModelTexture = z.infer<typeof insertModelTextureSchema>;
export type ModelTexture = z.infer<typeof modelTextureSchema>;

export const tempUploadSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  originalFileName: z.string(),
  originalPath: z.string(),
  glbPath: z.string().nullable(),
  usdzPath: z.string().nullable(),
  deviceType: z.string(),
  status: z.string().default("pending"),
  createdAt: z.date(),
});

export const insertTempUploadSchema = z.object({
  sessionId: z.string(),
  originalFileName: z.string(),
  originalPath: z.string(),
  glbPath: z.string().nullable().optional(),
  usdzPath: z.string().nullable().optional(),
  deviceType: z.string(),
  status: z.string().optional().default("pending"),
});

export type InsertTempUpload = z.infer<typeof insertTempUploadSchema>;
export type TempUpload = z.infer<typeof tempUploadSchema>;

export type DeviceType = "ios" | "android" | "both";
export type ConversionStatus = "pending" | "converting" | "ready" | "error";

export interface UploadResponse {
  id: string;
  status: ConversionStatus;
  glbPath?: string;
  usdzPath?: string;
  deviceType: DeviceType;
}

export interface ConfiguratorData {
  parts: string[];
  textures: Record<string, string[]>;
  materials: Record<string, string[]>;
  colors: string[];
}
