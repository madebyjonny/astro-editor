const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openProject: () => ipcRenderer.invoke("open-project"),
  openProjectByPath: (projectPath) =>
    ipcRenderer.invoke("open-project-by-path", projectPath),
  getRecentProjects: () => ipcRenderer.invoke("get-recent-projects"),
  removeRecentProject: (projectPath) =>
    ipcRenderer.invoke("remove-recent-project", projectPath),
  getCollections: (contentPath) =>
    ipcRenderer.invoke("get-collections", contentPath),
  getCollectionFiles: (collectionPath) =>
    ipcRenderer.invoke("get-collection-files", collectionPath),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  saveFile: (filePath, frontmatter, content) =>
    ipcRenderer.invoke("save-file", filePath, frontmatter, content),
  createFile: (collectionPath, filename, frontmatter, content) =>
    ipcRenderer.invoke(
      "create-file",
      collectionPath,
      filename,
      frontmatter,
      content
    ),
  getCollectionSchema: (contentPath, collectionName) =>
    ipcRenderer.invoke("get-collection-schema", contentPath, collectionName),
  checkProjectStatus: (projectPath) =>
    ipcRenderer.invoke("check-project-status", projectPath),
  startDevServer: (projectPath) =>
    ipcRenderer.invoke("start-dev-server", projectPath),
  stopDevServer: (projectPath) =>
    ipcRenderer.invoke("stop-dev-server", projectPath),
  openInBrowser: (url) => ipcRenderer.invoke("open-in-browser", url),
});
