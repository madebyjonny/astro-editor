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

// Files view - shown when a collection is selected
interface FilesViewProps {
  selectedCollection: Collection;
  files: FileItem[];
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  onBack: () => void;
}

function FilesView({
  selectedCollection,
  files,
  selectedFile,
  onSelectFile,
  onBack,
}: FilesViewProps): React.ReactElement {
  return (
    <>
      <div className="sidebar-header back-header" onClick={onBack}>
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
  );
}

// Collections view - shown when a project is open but no collection selected
interface CollectionsViewProps {
  projectPath: string;
  collections: Collection[];
  onSelectCollection: (collection: Collection) => void;
  onCloseProject: () => void;
}

function CollectionsView({
  projectPath,
  collections,
  onSelectCollection,
  onCloseProject,
}: CollectionsViewProps): React.ReactElement {
  return (
    <>
      <div className="sidebar-header back-header" onClick={onCloseProject}>
        <span className="back-arrow">←</span>
        <span>Recent Projects</span>
      </div>
      <div className="collection-title">📁 {projectPath.split("/").pop()}</div>
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
  );
}

// Recent projects view - shown when no project is open
interface RecentProjectsViewProps {
  recentProjects: RecentProject[];
  onOpenRecentProject: (path: string) => void;
  onRemoveRecentProject: (path: string, e: React.MouseEvent) => void;
}

function RecentProjectsView({
  recentProjects,
  onOpenRecentProject,
  onRemoveRecentProject,
}: RecentProjectsViewProps): React.ReactElement {
  return (
    <>
      <div className="sidebar-header">Recent Projects</div>
      <div className="recent-projects-list">
        {recentProjects.length === 0 ? (
          <div
            className="empty-state"
            style={{ padding: "20px", height: "auto" }}
          >
            <p style={{ fontSize: "13px" }}>No recent projects</p>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
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
                <span className="recent-project-name">📁 {project.name}</span>
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
  );
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
  const renderContent = (): React.ReactElement => {
    // Show files view when a collection is selected
    if (selectedCollection) {
      return (
        <FilesView
          selectedCollection={selectedCollection}
          files={files}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          onBack={() => onSelectCollection(null)}
        />
      );
    }

    // Show collections view when a project is open
    if (projectPath) {
      return (
        <CollectionsView
          projectPath={projectPath}
          collections={collections}
          onSelectCollection={onSelectCollection}
          onCloseProject={onCloseProject}
        />
      );
    }

    // Show recent projects view when no project is open
    return (
      <RecentProjectsView
        recentProjects={recentProjects}
        onOpenRecentProject={onOpenRecentProject}
        onRemoveRecentProject={onRemoveRecentProject}
      />
    );
  };

  return <div className="sidebar">{renderContent()}</div>;
}

export default Sidebar;
