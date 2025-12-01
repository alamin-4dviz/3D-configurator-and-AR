import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import express from "express";
import { storage } from "./storage";
import { generateToken, verifyPassword, authMiddleware, adminMiddleware, type AuthRequest } from "./auth";
import {
  ensureDirectories,
  saveTempFile,
  saveAdminFile,
  convertModel,
  cleanupTempSession,
  cleanupAdminModel,
  cleanupExpiredTempUploads,
  isSupported3DFormat,
  TEMP_DIR,
  UPLOADS_DIR,
} from "./conversion";
import { insertUserSchema } from "@shared/schema";
import type { DeviceType } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await ensureDirectories();
  await storage.ensureInitialized();

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  app.use("/uploads", express.static(UPLOADS_DIR));

  setInterval(() => {
    cleanupExpiredTempUploads(24 * 60 * 60 * 1000);
  }, 60 * 60 * 1000);

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      console.log('Login attempt:', { username, password: password ? '***' : 'missing' });
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      console.log('User found:', !!user);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValid = await verifyPassword(password, user.password);
      console.log('Password valid:', isValid);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = generateToken({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      });
      
      res.json({
        user: { id: user.id, username: user.username },
        token,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post(
    "/api/upload",
    upload.single("model"),
    async (req: Request, res: Response) => {
      try {
        const file = req.file;
        const { deviceType, sessionId } = req.body;
        
        if (!file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        
        if (!isSupported3DFormat(file.originalname)) {
          return res.status(400).json({ error: "Unsupported file format" });
        }
        
        if (!sessionId) {
          return res.status(400).json({ error: "Session ID is required" });
        }
        
        const validDeviceType = (deviceType as DeviceType) || "android";
        
        await cleanupTempSession(sessionId);
        await storage.deleteTempUploadsBySession(sessionId);
        
        const inputPath = await saveTempFile(file, sessionId);
        const outputDir = path.join(TEMP_DIR, sessionId);
        const baseFilename = `model_${Date.now()}`;
        
        const conversionResult = await convertModel(
          inputPath,
          outputDir,
          validDeviceType,
          baseFilename
        );
        
        if (!conversionResult.success) {
          return res.status(500).json({ error: conversionResult.error || "Conversion failed" });
        }
        
        const tempUpload = await storage.createTempUpload({
          sessionId,
          originalFileName: file.originalname,
          originalPath: inputPath,
          glbPath: conversionResult.glbPath || null,
          usdzPath: conversionResult.usdzPath || null,
          deviceType: validDeviceType,
          status: "ready",
        });
        
        res.json({
          id: tempUpload.id,
          status: "ready",
          glbPath: conversionResult.glbPath,
          usdzPath: conversionResult.usdzPath,
          deviceType: validDeviceType,
        });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to process upload" });
      }
    }
  );

  app.delete("/api/upload/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      await storage.deleteTempUploadsBySession(sessionId);
      await cleanupTempSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({ error: "Failed to cleanup" });
    }
  });

  app.post("/api/upload/cleanup/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      await storage.deleteTempUploadsBySession(sessionId);
      await cleanupTempSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({ error: "Failed to cleanup" });
    }
  });

  app.get("/api/models/public", async (req: Request, res: Response) => {
    try {
      const models = await storage.getPublicAdminModels();
      res.json(models);
    } catch (error) {
      console.error("Get public models error:", error);
      res.status(500).json({ error: "Failed to get models" });
    }
  });

  app.get("/api/models/:id", async (req: Request, res: Response) => {
    try {
      const model = await storage.getAdminModel(req.params.id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      if (!model.visible) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      console.error("Get model error:", error);
      res.status(500).json({ error: "Failed to get model" });
    }
  });

  app.get(
    "/api/admin/models",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const models = await storage.getAllAdminModels();
        res.json(models);
      } catch (error) {
        console.error("Get admin models error:", error);
        res.status(500).json({ error: "Failed to get models" });
      }
    }
  );

  app.get(
    "/api/admin/models/:id",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const model = await storage.getAdminModel(req.params.id);
        if (!model) {
          return res.status(404).json({ error: "Model not found" });
        }
        res.json(model);
      } catch (error) {
        console.error("Get admin model error:", error);
        res.status(500).json({ error: "Failed to get model" });
      }
    }
  );

  app.get(
    "/api/admin/models/:id/configurator",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const metadata = await storage.getConfiguratorMetadata(req.params.id);
        if (!metadata) {
          return res.json({ modelId: req.params.id, parts: [], textures: {}, materials: {}, colors: [] });
        }
        res.json(metadata);
      } catch (error) {
        console.error("Get configurator metadata error:", error);
        res.status(500).json({ error: "Failed to get configurator metadata" });
      }
    }
  );

  app.post(
    "/api/admin/models",
    authMiddleware,
    adminMiddleware,
    upload.fields([
      { name: "model", maxCount: 1 },
      { name: "textures", maxCount: 10 },
    ]),
    async (req: AuthRequest, res: Response) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const modelFile = files?.model?.[0];
        const textureFiles = files?.textures || [];
        
        if (!modelFile) {
          return res.status(400).json({ error: "Model file is required" });
        }
        
        const { title, description, category, visible, parts, colors } = req.body;
        
        if (!title) {
          return res.status(400).json({ error: "Title is required" });
        }
        
        const modelId = `model_${Date.now()}`;
        const glbPath = await saveAdminFile(modelFile, modelId, "model");
        
        const model = await storage.createAdminModel({
          title,
          description: description || null,
          category: category || "General",
          visible: visible === "true",
          glbPath,
          usdzPath: null,
          thumbnailPath: null,
        });
        
        const parsedParts = parts ? JSON.parse(parts) : [];
        const parsedColors = colors ? JSON.parse(colors) : [];
        
        await storage.createConfiguratorMetadata({
          modelId: model.id,
          parts: parsedParts,
          textures: {},
          materials: {},
          colors: parsedColors,
        });
        
        for (const textureFile of textureFiles) {
          const texturePath = await saveAdminFile(textureFile, model.id, "texture");
          await storage.createModelTexture({
            modelId: model.id,
            name: textureFile.originalname,
            type: "diffuse",
            filePath: texturePath,
          });
        }
        
        res.json(model);
      } catch (error) {
        console.error("Create admin model error:", error);
        res.status(500).json({ error: "Failed to create model" });
      }
    }
  );

  app.put(
    "/api/admin/models/:id",
    authMiddleware,
    adminMiddleware,
    upload.fields([
      { name: "model", maxCount: 1 },
      { name: "textures", maxCount: 10 },
    ]),
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const modelFile = files?.model?.[0];
        const textureFiles = files?.textures || [];
        
        const existing = await storage.getAdminModel(id);
        if (!existing) {
          return res.status(404).json({ error: "Model not found" });
        }
        
        const { title, description, category, visible, parts, colors } = req.body;
        
        let glbPath = existing.glbPath;
        if (modelFile) {
          glbPath = await saveAdminFile(modelFile, id, "model");
        }
        
        const updatedModel = await storage.updateAdminModel(id, {
          title: title || existing.title,
          description: description !== undefined ? description : existing.description,
          category: category || existing.category,
          visible: visible !== undefined ? visible === "true" : existing.visible,
          glbPath,
        });
        
        if (parts || colors) {
          const parsedParts = parts ? JSON.parse(parts) : [];
          const parsedColors = colors ? JSON.parse(colors) : [];
          
          const existingMeta = await storage.getConfiguratorMetadata(id);
          if (existingMeta) {
            await storage.updateConfiguratorMetadata(id, {
              parts: parsedParts,
              colors: parsedColors,
            });
          } else {
            await storage.createConfiguratorMetadata({
              modelId: id,
              parts: parsedParts,
              textures: {},
              materials: {},
              colors: parsedColors,
            });
          }
        }
        
        for (const textureFile of textureFiles) {
          const texturePath = await saveAdminFile(textureFile, id, "texture");
          await storage.createModelTexture({
            modelId: id,
            name: textureFile.originalname,
            type: "diffuse",
            filePath: texturePath,
          });
        }
        
        res.json(updatedModel);
      } catch (error) {
        console.error("Update admin model error:", error);
        res.status(500).json({ error: "Failed to update model" });
      }
    }
  );

  app.patch(
    "/api/admin/models/:id",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        const { visible } = req.body;
        
        const existing = await storage.getAdminModel(id);
        if (!existing) {
          return res.status(404).json({ error: "Model not found" });
        }
        
        const updated = await storage.updateAdminModel(id, { visible });
        res.json(updated);
      } catch (error) {
        console.error("Patch admin model error:", error);
        res.status(500).json({ error: "Failed to update model" });
      }
    }
  );

  app.delete(
    "/api/admin/models/:id",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        
        const existing = await storage.getAdminModel(id);
        if (!existing) {
          return res.status(404).json({ error: "Model not found" });
        }
        
        await storage.deleteAdminModel(id);
        await cleanupAdminModel(id);
        
        res.json({ success: true });
      } catch (error) {
        console.error("Delete admin model error:", error);
        res.status(500).json({ error: "Failed to delete model" });
      }
    }
  );

  return httpServer;
}
