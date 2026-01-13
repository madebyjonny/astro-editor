import React from "react";
import { useProjectStore, useDevServerStore } from "../stores";
import "./Toolbar.css";

function Toolbar(): React.ReactElement {
  const projectPath = useProjectStore((s) => s.projectPath);

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
        <div className="toolbar-left">
          <span className="toolbar-title">Astro Editor</span>
        </div>

        <div className="toolbar-right">
          {/* Dev Server Controls - minimal style */}
          {projectPath && !isRunning && !isStarting && (
            <button
              className="toolbar-icon-btn"
              onClick={handleStartDevServer}
              title="Start dev server"
            >
              ▶
            </button>
          )}
          {projectPath && isStarting && (
            <button className="toolbar-icon-btn" disabled title="Starting...">
              ⏳
            </button>
          )}
          {projectPath && isRunning && (
            <>
              <button
                className="toolbar-icon-btn running"
                onClick={handleStopDevServer}
                title="Stop dev server"
              >
                ⏹
              </button>
              <button
                className="toolbar-icon-btn preview"
                onClick={openPreview}
                title={`Preview on port ${port}`}
              >
                ↗
              </button>
            </>
          )}
        </div>
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
