import { create } from "zustand";
import type {
  Collection,
  FileItem,
  RecentProject,
  ProjectResult,
} from "../../types";

interface ProjectState {
  // State
  projectPath: string | null;
  contentPath: string | null;
  collections: Collection[];
  selectedCollection: Collection | null;
  files: FileItem[];
  recentProjects: RecentProject[];

  // Actions
  loadProject: (result: ProjectResult | null) => Promise<void>;
  openProject: () => Promise<void>;
  openRecentProject: (path: string) => Promise<void>;
  removeRecentProject: (path: string) => Promise<void>;
  closeProject: () => Promise<void>;
  selectCollection: (collection: Collection | null) => Promise<void>;
  refreshRecentProjects: () => Promise<void>;
  refreshFiles: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  projectPath: null,
  contentPath: null,
  collections: [],
  selectedCollection: null,
  files: [],
  recentProjects: [],

  // Actions
  loadProject: async (result) => {
    if (result && !result.error && result.projectPath && result.contentPath) {
      set({
        projectPath: result.projectPath,
        contentPath: result.contentPath,
        selectedCollection: null,
        files: [],
      });

      const collectionsResult = await window.electronAPI.getCollections(
        result.contentPath
      );
      if (!("error" in collectionsResult)) {
        set({ collections: collectionsResult as Collection[] });
      }

      // Refresh recent projects
      const projects = await window.electronAPI.getRecentProjects();
      set({ recentProjects: projects });
    } else if (result?.error) {
      alert(result.error);
    }
  },

  openProject: async () => {
    const result = await window.electronAPI.openProject();
    await get().loadProject(result);
  },

  openRecentProject: async (path) => {
    const result = await window.electronAPI.openProjectByPath(path);
    await get().loadProject(result);
  },

  removeRecentProject: async (path) => {
    const projects = await window.electronAPI.removeRecentProject(path);
    set({ recentProjects: projects });
  },

  closeProject: async () => {
    set({
      projectPath: null,
      contentPath: null,
      collections: [],
      selectedCollection: null,
      files: [],
    });
  },

  selectCollection: async (collection) => {
    if (!collection) {
      set({ selectedCollection: null, files: [] });
      return;
    }

    set({ selectedCollection: collection });

    const filesResult = await window.electronAPI.getCollectionFiles(
      collection.path
    );
    if (!("error" in filesResult)) {
      set({ files: filesResult as FileItem[] });
    }
  },

  refreshRecentProjects: async () => {
    const projects = await window.electronAPI.getRecentProjects();
    set({ recentProjects: projects });
  },

  refreshFiles: async () => {
    const { selectedCollection } = get();
    if (!selectedCollection) return;

    const filesResult = await window.electronAPI.getCollectionFiles(
      selectedCollection.path
    );
    if (!("error" in filesResult)) {
      set({ files: filesResult as FileItem[] });
    }
  },
}));
