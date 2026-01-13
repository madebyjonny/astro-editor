import React from "react";
import type { RecentProject } from "../../types";
import "./ProjectsSidebar.css";

interface ProjectsSidebarProps {
  recentProjects: RecentProject[];
  currentProjectPath: string | null;
  onOpenRecentProject: (path: string) => void;
  onRemoveRecentProject: (path: string, e: React.MouseEvent) => void;
  onOpenProject: () => void;
}

function ProjectsSidebar({
  recentProjects,
  currentProjectPath,
  onOpenRecentProject,
  onRemoveRecentProject,
  onOpenProject,
}: ProjectsSidebarProps): React.ReactElement {
  return (
    <div className="projects-sidebar">
      <div className="projects-sidebar-header">
        <span className="projects-sidebar-title">Workspaces</span>
      </div>

      <div className="projects-list">
        {recentProjects.map((project) => (
          <div
            key={project.path}
            className={`project-item ${
              currentProjectPath === project.path ? "active" : ""
            }`}
            onClick={() => onOpenRecentProject(project.path)}
            title={project.path}
          >
            <span className="project-icon">📁</span>
            <span className="project-name">{project.name}</span>
            <button
              className="project-remove"
              onClick={(e) => onRemoveRecentProject(project.path, e)}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="projects-sidebar-footer">
        <button className="new-workspace-btn" onClick={onOpenProject}>
          + New space
        </button>
      </div>
    </div>
  );
}

export default ProjectsSidebar;
