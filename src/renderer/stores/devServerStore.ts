import { create } from "zustand";
import type { DevServerStatus } from "../../types";

interface DevServerState extends DevServerStatus {
  // Actions
  checkStatus: (projectPath: string) => Promise<void>;
  start: (projectPath: string) => Promise<boolean>;
  stop: (projectPath: string) => Promise<void>;
  openPreview: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState: DevServerStatus = {
  isRunning: false,
  isStarting: false,
  port: null,
  error: null,
};

export const useDevServerStore = create<DevServerState>((set, get) => ({
  ...initialState,

  checkStatus: async (projectPath) => {
    const status = await window.electronAPI.checkProjectStatus(projectPath);
    if (status.isRunning) {
      set({ isRunning: true });
    }
  },

  start: async (projectPath) => {
    // First check if project can run
    const status = await window.electronAPI.checkProjectStatus(projectPath);
    if (!status.canRun) {
      set({ error: status.error || null });
      return false;
    }

    set({ isStarting: true, error: null });

    const result = await window.electronAPI.startDevServer(projectPath);
    if (result.success) {
      set({
        isRunning: true,
        isStarting: false,
        port: result.port || null,
        error: null,
      });
      return true;
    } else {
      set({
        isRunning: false,
        isStarting: false,
        port: null,
        error: result.error || null,
      });
      return false;
    }
  },

  stop: async (projectPath) => {
    await window.electronAPI.stopDevServer(projectPath);
    set(initialState);
  },

  openPreview: async () => {
    const { port } = get();
    if (port) {
      await window.electronAPI.openInBrowser(`http://localhost:${port}`);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
