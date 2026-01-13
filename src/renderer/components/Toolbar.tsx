import React from "react";
import {
  useProjectStore,
  useEditorStore,
  useDevServerStore,
  useUIStore,
} from "../stores";
import "./Toolbar.css";

function Toolbar(): React.ReactElement {
  const projectPath = useProjectStore((s) => s.projectPath);
  const openProject = useProjectStore((s) => s.openProject);
  const selectedCollection = useProjectStore((s) => s.selectedCollection);

  const selectedFile = useEditorStore((s) => s.selectedFile);
  const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges);
  const save = useEditorStore((s) => s.save);

  const {
    isRunning,
    isStarting,
    port,
    error,
    start,
    stop,
    openPreview,
    clearError,
  } = useDevServerStore();

  const openNewFileModal = useUIStore((s) => s.openNewFileModal);

  const handleStartDevServer = async (): Promise<void> => {
    if (projectPath) {
      await start(projectPath);
    }
  };

  const handleStopDevServer = async (): Promise<void> => {
    if (projectPath) {
      await stop(projectPath);
    }
  };

  return (
    <>
      <div className="toolbar">
        <h1>📝 Astro Content Editor</h1>
        <button className="btn btn-primary" onClick={openProject}>
          Open Project
        </button>
        {selectedFile && (
          <button className="btn btn-success" onClick={save}>
            Save{" "}
            {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
          </button>
        )}
        {selectedCollection && (
          <button className="btn btn-secondary" onClick={openNewFileModal}>
            + New File
          </button>
        )}

        {/* Dev Server Controls */}
        {projectPath && <div className="toolbar-divider" />}
        {projectPath && !isRunning && !isStarting && (
          <button className="btn btn-run" onClick={handleStartDevServer}>
            ▶ Run Dev Server
          </button>
        )}
        {projectPath && isStarting && (
          <button className="btn btn-run" disabled>
            ⏳ Starting...
          </button>
        )}
        {projectPath && isRunning && (
          <>
            <button className="btn btn-stop" onClick={handleStopDevServer}>
              ⏹ Stop
            </button>
            <button className="btn btn-preview" onClick={openPreview}>
              🌐 Preview :{port}
            </button>
          </>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}
    </>
  );
}

export default Toolbar;
