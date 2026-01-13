import { contextBridge, ipcRenderer } from "electron";
import type { ElectronAPI } from "./src/types";

const electronAPI: ElectronAPI = {
  openProject: () => ipcRenderer.invoke("open-project"),
  openProjectByPath: (projectPath: string) =>
    ipcRenderer.invoke("open-project-by-path", projectPath),
  getRecentProjects: () => ipcRenderer.invoke("get-recent-projects"),
  removeRecentProject: (projectPath: string) =>
    ipcRenderer.invoke("remove-recent-project", projectPath),
  getCollections: (contentPath: string) =>
    ipcRenderer.invoke("get-collections", contentPath),
  getCollectionFiles: (collectionPath: string) =>
    ipcRenderer.invoke("get-collection-files", collectionPath),
  getAllFiles: (contentPath: string) =>
    ipcRenderer.invoke("get-all-files", contentPath),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  saveFile: (
    filePath: string,
    frontmatter: Record<string, unknown>,
    content: string
  ) => ipcRenderer.invoke("save-file", filePath, frontmatter, content),
  createFile: (
    collectionPath: string,
    filename: string,
    frontmatter: Record<string, unknown>,
    content: string
  ) =>
    ipcRenderer.invoke(
      "create-file",
      collectionPath,
      filename,
      frontmatter,
      content
    ),
  getCollectionSchema: (contentPath: string, collectionName: string) =>
    ipcRenderer.invoke("get-collection-schema", contentPath, collectionName),
  checkProjectStatus: (projectPath: string) =>
    ipcRenderer.invoke("check-project-status", projectPath),
  startDevServer: (projectPath: string) =>
    ipcRenderer.invoke("start-dev-server", projectPath),
  stopDevServer: (projectPath: string) =>
    ipcRenderer.invoke("stop-dev-server", projectPath),
  openInBrowser: (url: string) => ipcRenderer.invoke("open-in-browser", url),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
