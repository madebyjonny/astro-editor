import { create } from "zustand";
import type { FileItem, FileContent, Frontmatter, Schema } from "../../types";

interface EditorState {
  // State
  selectedFile: FileItem | null;
  fileContent: FileContent | null;
  frontmatter: Frontmatter;
  content: string;
  schema: Schema;
  hasUnsavedChanges: boolean;

  // Actions
  selectFile: (file: FileItem) => Promise<boolean>;
  loadSchema: (contentPath: string, collectionName: string) => Promise<void>;
  setContent: (content: string) => void;
  setFrontmatter: (key: string, value: Frontmatter[string]) => void;
  save: () => Promise<boolean>;
  createFile: (
    collectionPath: string,
    filename: string,
    frontmatter: Frontmatter
  ) => Promise<{ success: boolean; path?: string }>;
  reset: () => void;
  confirmUnsavedChanges: () => boolean;
}

const initialState = {
  selectedFile: null,
  fileContent: null,
  frontmatter: {},
  content: "",
  schema: {},
  hasUnsavedChanges: false,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  selectFile: async (file) => {
    const { hasUnsavedChanges } = get();

    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Do you want to discard them?"
      );
      if (!confirm) return false;
    }

    set({ selectedFile: file });

    const result = await window.electronAPI.readFile(file.path);
    if (!("error" in result)) {
      const fileResult = result as FileContent;
      set({
        fileContent: fileResult,
        frontmatter: fileResult.frontmatter || {},
        content: fileResult.content || "",
        hasUnsavedChanges: false,
      });
      return true;
    }
    return false;
  },

  loadSchema: async (contentPath, collectionName) => {
    const schemaResult = await window.electronAPI.getCollectionSchema(
      contentPath,
      collectionName
    );
    set({ schema: schemaResult });
  },

  setContent: (content) => {
    set({ content, hasUnsavedChanges: true });
  },

  setFrontmatter: (key, value) => {
    set((state) => ({
      frontmatter: { ...state.frontmatter, [key]: value },
      hasUnsavedChanges: true,
    }));
  },

  save: async () => {
    const { selectedFile, frontmatter, content } = get();
    if (!selectedFile) return false;

    const result = await window.electronAPI.saveFile(
      selectedFile.path,
      frontmatter,
      content
    );

    if (result.success) {
      set({ hasUnsavedChanges: false });
      return true;
    } else {
      alert("Failed to save: " + result.error);
      return false;
    }
  },

  createFile: async (collectionPath, filename, frontmatter) => {
    const result = await window.electronAPI.createFile(
      collectionPath,
      filename,
      frontmatter,
      ""
    );

    if (!result.success) {
      alert("Failed to create file: " + result.error);
    }

    return { success: !!result.success, path: result.path };
  },

  reset: () => {
    set({
      selectedFile: null,
      fileContent: null,
      frontmatter: {},
      content: "",
      hasUnsavedChanges: false,
    });
  },

  confirmUnsavedChanges: () => {
    const { hasUnsavedChanges } = get();
    if (hasUnsavedChanges) {
      return window.confirm(
        "You have unsaved changes. Do you want to discard them?"
      );
    }
    return true;
  },
}));
