import React, { useEffect } from "react";
import Toolbar from "./components/Toolbar";
import Sidebar from "./components/Sidebar";
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
  const closeNewFileModal = useUIStore((s) => s.closeNewFileModal);

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

  // Handle recent project removal
  const handleRemoveRecentProject = async (
    path: string,
    e: React.MouseEvent
  ): Promise<void> => {
    e.stopPropagation();
    await removeRecentProject(path);
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
        <Sidebar
          projectPath={projectPath}
          collections={collections}
          selectedCollection={selectedCollection}
          onSelectCollection={handleSelectCollection}
          files={files}
          selectedFile={selectedFile}
          onSelectFile={handleSelectFile}
          recentProjects={recentProjects}
          onOpenRecentProject={openRecentProject}
          onRemoveRecentProject={handleRemoveRecentProject}
          onCloseProject={handleCloseProject}
        />

        <EditorPanel
          selectedFile={selectedFile}
          content={content}
          onContentChange={setContent}
        />

        <MetadataPanel
          selectedFile={selectedFile}
          frontmatter={frontmatter}
          schema={schema}
          onFrontmatterChange={setFrontmatter}
        />
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
