import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const JWT_SECRET = process.env.SESSION_SECRET || "ar-viewer-secret-key";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    isAdmin: boolean;
  };
}

export function generateToken(user: { id: string; username: string; isAdmin: boolean }): string {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): { id: string; username: string; isAdmin: boolean } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string; isAdmin: boolean };
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const result = await bcrypt.compare(password, hashedPassword);
    console.log('Password verification:', { password: '***', hashedPassword: hashedPassword.substring(0, 20) + '...', result });
    return result;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = decoded;
  next();
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
