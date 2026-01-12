import React, { useState, useCallback, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import EditorPanel from "./components/EditorPanel";
import MetadataPanel from "./components/MetadataPanel";
import NewFileModal from "./components/NewFileModal";

function App() {
  const [projectPath, setProjectPath] = useState(null);
  const [contentPath, setContentPath] = useState(null);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [frontmatter, setFrontmatter] = useState({});
  const [content, setContent] = useState("");
  const [schema, setSchema] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [recentProjects, setRecentProjects] = useState([]);
  const [devServerStatus, setDevServerStatus] = useState({
    isRunning: false,
    isStarting: false,
    port: null,
    error: null,
  });

  // Load recent projects on mount
  useEffect(() => {
    const loadRecentProjects = async () => {
      const projects = await window.electronAPI.getRecentProjects();
      setRecentProjects(projects);
    };
    loadRecentProjects();
  }, []);

  // Check dev server status when project changes
  useEffect(() => {
    const checkStatus = async () => {
      if (projectPath) {
        const status = await window.electronAPI.checkProjectStatus(projectPath);
        if (status.isRunning) {
          setDevServerStatus((prev) => ({ ...prev, isRunning: true }));
        }
      } else {
        setDevServerStatus({
          isRunning: false,
          isStarting: false,
          port: null,
          error: null,
        });
      }
    };
    checkStatus();
  }, [projectPath]);

  const loadProject = async (result) => {
    if (result && !result.error) {
      setProjectPath(result.projectPath);
      setContentPath(result.contentPath);

      const collectionsResult = await window.electronAPI.getCollections(
        result.contentPath
      );
      if (!collectionsResult.error) {
        setCollections(collectionsResult);
      }

      // Reset state
      setSelectedCollection(null);
      setFiles([]);
      setSelectedFile(null);
      setFileContent(null);
      setFrontmatter({});
      setContent("");

      // Refresh recent projects
      const projects = await window.electronAPI.getRecentProjects();
      setRecentProjects(projects);
    } else if (result?.error) {
      alert(result.error);
    }
  };

  const handleOpenProject = async () => {
    const result = await window.electronAPI.openProject();
    await loadProject(result);
  };

  const handleOpenRecentProject = async (path) => {
    const result = await window.electronAPI.openProjectByPath(path);
    await loadProject(result);
  };

  const handleRemoveRecentProject = async (path, e) => {
    e.stopPropagation();
    const projects = await window.electronAPI.removeRecentProject(path);
    setRecentProjects(projects);
  };

  const handleCloseProject = async () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Do you want to discard them?"
      );
      if (!confirm) return;
    }
    // Stop dev server if running
    if (devServerStatus.isRunning && projectPath) {
      await window.electronAPI.stopDevServer(projectPath);
    }
    setProjectPath(null);
    setContentPath(null);
    setCollections([]);
    setSelectedCollection(null);
    setFiles([]);
    setSelectedFile(null);
    setFileContent(null);
    setFrontmatter({});
    setContent("");
    setHasUnsavedChanges(false);
    setDevServerStatus({
      isRunning: false,
      isStarting: false,
      port: null,
      error: null,
    });
  };

  const handleStartDevServer = async () => {
    if (!projectPath) return;

    // First check if project can run
    const status = await window.electronAPI.checkProjectStatus(projectPath);
    if (!status.canRun) {
      setDevServerStatus((prev) => ({ ...prev, error: status.error }));
      return;
    }

    setDevServerStatus((prev) => ({ ...prev, isStarting: true, error: null }));

    const result = await window.electronAPI.startDevServer(projectPath);
    if (result.success) {
      setDevServerStatus({
        isRunning: true,
        isStarting: false,
        port: result.port,
        error: null,
      });
    } else {
      setDevServerStatus({
        isRunning: false,
        isStarting: false,
        port: null,
        error: result.error,
      });
    }
  };

  const handleStopDevServer = async () => {
    if (!projectPath) return;
    await window.electronAPI.stopDevServer(projectPath);
    setDevServerStatus({
      isRunning: false,
      isStarting: false,
      port: null,
      error: null,
    });
  };

  const handleOpenPreview = async () => {
    if (devServerStatus.port) {
      await window.electronAPI.openInBrowser(
        `http://localhost:${devServerStatus.port}`
      );
    }
  };

  const handleSelectCollection = async (collection) => {
    setSelectedCollection(collection);
    const filesResult = await window.electronAPI.getCollectionFiles(
      collection.path
    );
    if (!filesResult.error) {
      setFiles(filesResult);
    }

    // Get schema for this collection
    const schemaResult = await window.electronAPI.getCollectionSchema(
      contentPath,
      collection.name
    );
    setSchema(schemaResult);

    // Reset file selection
    setSelectedFile(null);
    setFileContent(null);
    setFrontmatter({});
    setContent("");
  };

  const handleSelectFile = async (file) => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Do you want to discard them?"
      );
      if (!confirm) return;
    }

    setSelectedFile(file);
    const result = await window.electronAPI.readFile(file.path);
    if (!result.error) {
      setFileContent(result);
      setFrontmatter(result.frontmatter || {});
      setContent(result.content || "");
      setHasUnsavedChanges(false);
    }
  };

  const handleContentChange = useCallback((value) => {
    setContent(value || "");
    setHasUnsavedChanges(true);
  }, []);

  const handleFrontmatterChange = useCallback((key, value) => {
    setFrontmatter((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async () => {
    if (!selectedFile) return;

    const result = await window.electronAPI.saveFile(
      selectedFile.path,
      frontmatter,
      content
    );
    if (result.success) {
      setHasUnsavedChanges(false);
    } else {
      alert("Failed to save: " + result.error);
    }
  };

  const handleCreateFile = async (title, newFrontmatter) => {
    if (!selectedCollection) return;

    const result = await window.electronAPI.createFile(
      selectedCollection.path,
      title,
      newFrontmatter,
      ""
    );

    if (result.success) {
      // Refresh files list
      const filesResult = await window.electronAPI.getCollectionFiles(
        selectedCollection.path
      );
      if (!filesResult.error) {
        setFiles(filesResult);
      }

      // Select the new file
      const newFile = filesResult.find((f) => f.path === result.path);
      if (newFile) {
        handleSelectFile(newFile);
      }

      setShowNewFileModal(false);
    } else {
      alert("Failed to create file: " + result.error);
    }
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <h1>📝 Astro Content Editor</h1>
        <button className="btn btn-primary" onClick={handleOpenProject}>
          Open Project
        </button>
        {selectedFile && (
          <button className="btn btn-success" onClick={handleSave}>
            Save{" "}
            {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
          </button>
        )}
        {selectedCollection && (
          <button
            className="btn btn-secondary"
            onClick={() => setShowNewFileModal(true)}
          >
            + New File
          </button>
        )}

        {/* Dev Server Controls */}
        {projectPath && <div className="toolbar-divider" />}
        {projectPath &&
          !devServerStatus.isRunning &&
          !devServerStatus.isStarting && (
            <button className="btn btn-run" onClick={handleStartDevServer}>
              ▶ Run Dev Server
            </button>
          )}
        {projectPath && devServerStatus.isStarting && (
          <button className="btn btn-run" disabled>
            ⏳ Starting...
          </button>
        )}
        {projectPath && devServerStatus.isRunning && (
          <>
            <button className="btn btn-stop" onClick={handleStopDevServer}>
              ⏹ Stop
            </button>
            <button className="btn btn-preview" onClick={handleOpenPreview}>
              🌐 Preview :{devServerStatus.port}
            </button>
          </>
        )}
      </div>

      {/* Error Banner */}
      {devServerStatus.error && (
        <div className="error-banner">
          <span>⚠️ {devServerStatus.error}</span>
          <button
            onClick={() =>
              setDevServerStatus((prev) => ({ ...prev, error: null }))
            }
          >
            ×
          </button>
        </div>
      )}

      <div className="main-content">
        <Sidebar
          projectPath={projectPath}
          collections={collections}
          selectedCollection={selectedCollection}
          onSelectCollection={handleSelectCollection}
          files={files}
          selectedFile={selectedFile}
          onSelectFile={handleSelectFile}
          recentProjects={recentProjects}
          onOpenRecentProject={handleOpenRecentProject}
          onRemoveRecentProject={handleRemoveRecentProject}
          onCloseProject={handleCloseProject}
        />

        <EditorPanel
          selectedFile={selectedFile}
          content={content}
          onContentChange={handleContentChange}
        />

        <MetadataPanel
          selectedFile={selectedFile}
          frontmatter={frontmatter}
          schema={schema}
          onFrontmatterChange={handleFrontmatterChange}
        />
      </div>

      {showNewFileModal && (
        <NewFileModal
          schema={schema}
          onClose={() => setShowNewFileModal(false)}
          onCreate={handleCreateFile}
        />
      )}
    </div>
  );
}

export default App;
