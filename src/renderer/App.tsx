import React, { useEffect } from "react";
import Toolbar from "./components/Toolbar";
import ProjectsSidebar from "./components/ProjectsSidebar";
import DocumentsGrid from "./components/DocumentsGrid";
import EditorPanel from "./components/EditorPanel";
import MetadataPanel from "./components/MetadataPanel";
import NewFileModal from "./components/NewFileModal";
import {
  useProjectStore,
  useEditorStore,
  useDevServerStore,
  useUIStore,
} from "./stores";

function App(): React.ReactElement {
  // Project store
  const projectPath = useProjectStore((s) => s.projectPath);
  const contentPath = useProjectStore((s) => s.contentPath);
  const collections = useProjectStore((s) => s.collections);
  const selectedCollection = useProjectStore((s) => s.selectedCollection);
  const files = useProjectStore((s) => s.files);
  const recentProjects = useProjectStore((s) => s.recentProjects);
  const selectCollection = useProjectStore((s) => s.selectCollection);
  const closeProject = useProjectStore((s) => s.closeProject);
  const openProject = useProjectStore((s) => s.openProject);
  const openRecentProject = useProjectStore((s) => s.openRecentProject);
  const removeRecentProject = useProjectStore((s) => s.removeRecentProject);
  const refreshRecentProjects = useProjectStore((s) => s.refreshRecentProjects);
  const refreshFiles = useProjectStore((s) => s.refreshFiles);

  // Editor store
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const content = useEditorStore((s) => s.content);
  const frontmatter = useEditorStore((s) => s.frontmatter);
  const schema = useEditorStore((s) => s.schema);
  const selectFile = useEditorStore((s) => s.selectFile);
  const setContent = useEditorStore((s) => s.setContent);
  const setFrontmatter = useEditorStore((s) => s.setFrontmatter);
  const loadSchema = useEditorStore((s) => s.loadSchema);
  const createFile = useEditorStore((s) => s.createFile);
  const resetEditor = useEditorStore((s) => s.reset);
  const confirmUnsavedChanges = useEditorStore((s) => s.confirmUnsavedChanges);

  // Dev server store
  const isRunning = useDevServerStore((s) => s.isRunning);
  const checkDevServerStatus = useDevServerStore((s) => s.checkStatus);
  const stopDevServer = useDevServerStore((s) => s.stop);
  const resetDevServer = useDevServerStore((s) => s.reset);

  // UI store
  const showNewFileModal = useUIStore((s) => s.showNewFileModal);
  const openNewFileModal = useUIStore((s) => s.openNewFileModal);
  const closeNewFileModal = useUIStore((s) => s.closeNewFileModal);

  // Get project name from path
  const projectName = projectPath
    ? projectPath.split("/").pop() || "Project"
    : "";

  // Load recent projects on mount
  useEffect(() => {
    refreshRecentProjects();
  }, [refreshRecentProjects]);

  // Check dev server status when project changes
  useEffect(() => {
    if (projectPath) {
      checkDevServerStatus(projectPath);
    } else {
      resetDevServer();
    }
  }, [projectPath, checkDevServerStatus, resetDevServer]);

  // Handle collection selection with schema loading
  const handleSelectCollection = async (
    collection: typeof selectedCollection
  ): Promise<void> => {
    await selectCollection(collection);
    resetEditor();

    if (collection && contentPath) {
      await loadSchema(contentPath, collection.name);
    }
  };

  // Handle project close
  const handleCloseProject = async (): Promise<void> => {
    if (!confirmUnsavedChanges()) return;

    if (isRunning && projectPath) {
      await stopDevServer(projectPath);
    }

    await closeProject();
    resetEditor();
    resetDevServer();
  };

  // Handle file selection
  const handleSelectFile = async (file: typeof selectedFile): Promise<void> => {
    if (file) {
      await selectFile(file);
    }
  };

  // Handle going back from editor to documents grid
  const handleBackToDocuments = (): void => {
    if (!confirmUnsavedChanges()) return;
    resetEditor();
  };

  // Handle clicking on a project in sidebar
  const handleOpenRecentProject = async (path: string): Promise<void> => {
    if (!confirmUnsavedChanges()) return;
    resetEditor();
    await openRecentProject(path);
  };

  // Handle recent project removal
  const handleRemoveRecentProject = async (
    path: string,
    e: React.MouseEvent
  ): Promise<void> => {
    e.stopPropagation();

    // If removing the current project, check for unsaved changes first
    if (projectPath === path && !confirmUnsavedChanges()) return;

    await removeRecentProject(path);

    // Reset editor if we removed the current project
    if (projectPath === path) {
      resetEditor();
    }
  };

  // Handle opening new document modal for a specific collection
  const handleNewDocument = async (
    collection: typeof selectedCollection
  ): Promise<void> => {
    if (!collection || !contentPath) return;

    // Select the collection first to load the schema
    await handleSelectCollection(collection);
    openNewFileModal();
  };

  // Handle file creation
  const handleCreateFile = async (
    filename: string,
    newFrontmatter: typeof frontmatter
  ): Promise<void> => {
    if (!selectedCollection) return;

    const result = await createFile(
      selectedCollection.path,
      filename,
      newFrontmatter
    );

    if (result.success) {
      await refreshFiles();

      // Select the new file
      const newFile = files.find((f) => f.path === result.path);
      if (newFile) {
        await selectFile(newFile);
      }

      closeNewFileModal();
    }
  };

  return (
    <div className="app-container">
      <Toolbar />

      <div className="main-content">
        {/* Left: Projects/Workspaces sidebar */}
        <ProjectsSidebar
          recentProjects={recentProjects}
          currentProjectPath={projectPath}
          onOpenRecentProject={handleOpenRecentProject}
          onRemoveRecentProject={handleRemoveRecentProject}
          onOpenProject={openProject}
        />

        {/* Middle: Documents grid or Editor */}
        {selectedFile ? (
          <EditorPanel
            selectedFile={selectedFile}
            content={content}
            onContentChange={setContent}
            onBack={handleBackToDocuments}
          />
        ) : (
          <DocumentsGrid
            projectPath={projectPath}
            projectName={projectName}
            collections={collections}
            selectedCollection={selectedCollection}
            onSelectCollection={handleSelectCollection}
            files={files}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
            onNewDocument={handleNewDocument}
          />
        )}

        {/* Right: Metadata panel (only when file selected) */}
        {selectedFile && (
          <MetadataPanel
            selectedFile={selectedFile}
            frontmatter={frontmatter}
            schema={schema}
            onFrontmatterChange={setFrontmatter}
          />
        )}
      </div>

      {showNewFileModal && (
        <NewFileModal
          schema={schema}
          onClose={closeNewFileModal}
          onCreate={handleCreateFile}
        />
      )}
    </div>
  );
}

export default App;
