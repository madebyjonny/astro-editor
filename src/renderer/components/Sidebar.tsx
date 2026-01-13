import React from "react";
import type { Collection, FileItem, RecentProject } from "../../types";
import "./Sidebar.css";

interface SidebarProps {
  projectPath: string | null;
  collections: Collection[];
  selectedCollection: Collection | null;
  onSelectCollection: (collection: Collection | null) => void;
  files: FileItem[];
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  recentProjects: RecentProject[];
  onOpenRecentProject: (path: string) => void;
  onRemoveRecentProject: (path: string, e: React.MouseEvent) => void;
  onCloseProject: () => void;
}

function Sidebar({
  projectPath,
  collections,
  selectedCollection,
  onSelectCollection,
  files,
  selectedFile,
  onSelectFile,
  recentProjects,
  onOpenRecentProject,
  onRemoveRecentProject,
  onCloseProject,
}: SidebarProps): React.ReactElement {
  return (
    <div className="sidebar">
      {/* Show files view when a collection is selected */}
      {selectedCollection ? (
        <>
          <div
            className="sidebar-header back-header"
            onClick={() => onSelectCollection(null)}
          >
            <span className="back-arrow">←</span>
            <span>Collections</span>
          </div>
          <div className="collection-title">📂 {selectedCollection.name}</div>
          <div className="files-list">
            {files.length === 0 ? (
              <div
                style={{
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "#888",
                }}
              >
                No files found
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.path}
                  className={`file-item ${
                    selectedFile?.path === file.path ? "active" : ""
                  }`}
                  onClick={() => onSelectFile(file)}
                  title={file.name}
                >
                  📄 {file.name}
                </div>
              ))
            )}
          </div>
        </>
      ) : projectPath ? (
        <>
          <div className="sidebar-header back-header" onClick={onCloseProject}>
            <span className="back-arrow">←</span>
            <span>Recent Projects</span>
          </div>
          <div className="collection-title">
            📁 {projectPath.split("/").pop()}
          </div>
          <div className="collections-list">
            {collections.length === 0 ? (
              <div
                className="empty-state"
                style={{ padding: "20px", height: "auto" }}
              >
                <p style={{ fontSize: "13px" }}>No collections found</p>
              </div>
            ) : (
              collections.map((collection) => (
                <div
                  key={collection.path}
                  className="collection-item"
                  onClick={() => onSelectCollection(collection)}
                >
                  <span className="collection-icon">📂</span>
                  <span>{collection.name}</span>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="sidebar-header">Recent Projects</div>
          <div className="recent-projects-list">
            {recentProjects.length === 0 ? (
              <div
                className="empty-state"
                style={{ padding: "20px", height: "auto" }}
              >
                <p style={{ fontSize: "13px" }}>No recent projects</p>
                <p
                  style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}
                >
                  Click "Open Project" to get started
                </p>
              </div>
            ) : (
              recentProjects.map((project) => (
                <div
                  key={project.path}
                  className="recent-project-item"
                  onClick={() => onOpenRecentProject(project.path)}
                  title={project.path}
                >
                  <div className="recent-project-info">
                    <span className="recent-project-name">
                      📁 {project.name}
                    </span>
                    <span className="recent-project-path">{project.path}</span>
                  </div>
                  <button
                    className="recent-project-remove"
                    onClick={(e) => onRemoveRecentProject(project.path, e)}
                    title="Remove from recent"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Sidebar;
