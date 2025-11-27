import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeviceType, ConversionStatus, AdminModel } from "@shared/schema";

interface UploadState {
  sessionId: string;
  deviceType: DeviceType;
  uploadId: string | null;
  status: ConversionStatus;
  glbPath: string | null;
  usdzPath: string | null;
  originalFileName: string | null;
  error: string | null;
  setDeviceType: (type: DeviceType) => void;
  setUploadState: (state: Partial<UploadState>) => void;
  resetUpload: () => void;
}

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useUploadStore = create<UploadState>((set) => ({
  sessionId: generateSessionId(),
  deviceType: "android",
  uploadId: null,
  status: "pending",
  glbPath: null,
  usdzPath: null,
  originalFileName: null,
  error: null,
  setDeviceType: (type) => set({ deviceType: type }),
  setUploadState: (state) => set((prev) => ({ ...prev, ...state })),
  resetUpload: () =>
    set({
      uploadId: null,
      status: "pending",
      glbPath: null,
      usdzPath: null,
      originalFileName: null,
      error: null,
    }),
}));

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: { id: string; username: string } | null;
  token: string | null;
  login: (user: { id: string; username: string }, token: string, isAdmin: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      token: null,
      login: (user, token, isAdmin) =>
        set({ isAuthenticated: true, user, token, isAdmin }),
      logout: () =>
        set({ isAuthenticated: false, user: null, token: null, isAdmin: false }),
    }),
    {
      name: "auth-storage",
    }
  )
);

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-storage",
    }
  )
);

interface AdminModelState {
  selectedModel: AdminModel | null;
  isEditing: boolean;
  setSelectedModel: (model: AdminModel | null) => void;
  setIsEditing: (editing: boolean) => void;
}

export const useAdminModelStore = create<AdminModelState>((set) => ({
  selectedModel: null,
  isEditing: false,
  setSelectedModel: (model) => set({ selectedModel: model }),
  setIsEditing: (editing) => set({ isEditing: editing }),
}));
