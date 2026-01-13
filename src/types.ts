// Type definitions for the Astro Content Editor

// Collection and File types
export interface Collection {
  name: string;
  path: string;
}

export interface FileItem {
  name: string;
  path: string;
  preview?: string;
  collectionName?: string;
}

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: string;
}

// Frontmatter and Schema types
export interface FieldSchema {
  type: "string" | "number" | "boolean" | "date" | "array" | "enum";
  required: boolean;
}

export interface Schema {
  [key: string]: FieldSchema;
}

export interface Frontmatter {
  [key: string]: string | number | boolean | Date | string[] | null | undefined;
}

// File content types
export interface FileContent {
  frontmatter: Frontmatter;
  content: string;
  raw: string;
}

// Dev server types
export interface DevServerStatus {
  isRunning: boolean;
  isStarting: boolean;
  port: number | null;
  error: string | null;
}

export interface DevServerInfo {
  process: import("child_process").ChildProcess;
  port: number;
}

// IPC response types
export interface ProjectResult {
  projectPath?: string;
  contentPath?: string;
  error?: string;
}

export interface ProjectStatus {
  canRun: boolean;
  isRunning?: boolean;
  error?: string;
}

export interface DevServerResult {
  success?: boolean;
  port?: number;
  alreadyRunning?: boolean;
  warning?: string;
  error?: string;
  message?: string;
}

export interface FileOperationResult {
  success?: boolean;
  path?: string;
  error?: string;
}

export interface CollectionsResult {
  error?: string;
}

// Store types
export interface StoreData {
  recentProjects?: RecentProject[];
}

// Electron API exposed to renderer
export interface ElectronAPI {
  openProject: () => Promise<ProjectResult | null>;
  openProjectByPath: (projectPath: string) => Promise<ProjectResult>;
  getRecentProjects: () => Promise<RecentProject[]>;
  removeRecentProject: (projectPath: string) => Promise<RecentProject[]>;
  getCollections: (
    contentPath: string
  ) => Promise<Collection[] | CollectionsResult>;
  getCollectionFiles: (
    collectionPath: string
  ) => Promise<FileItem[] | CollectionsResult>;
  getAllFiles: (contentPath: string) => Promise<FileItem[] | CollectionsResult>;
  readFile: (filePath: string) => Promise<FileContent | CollectionsResult>;
  saveFile: (
    filePath: string,
    frontmatter: Frontmatter,
    content: string
  ) => Promise<FileOperationResult>;
  createFile: (
    collectionPath: string,
    filename: string,
    frontmatter: Frontmatter,
    content: string
  ) => Promise<FileOperationResult>;
  getCollectionSchema: (
    contentPath: string,
    collectionName: string
  ) => Promise<Schema>;
  checkProjectStatus: (projectPath: string) => Promise<ProjectStatus>;
  startDevServer: (projectPath: string) => Promise<DevServerResult>;
  stopDevServer: (projectPath: string) => Promise<DevServerResult>;
  openInBrowser: (url: string) => Promise<{ success: boolean }>;
}

// Extend Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
