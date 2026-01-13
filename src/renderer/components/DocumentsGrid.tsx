import React from "react";
import type { Collection, FileItem } from "../../types";
import DocumentCard from "./DocumentCard";
import "./DocumentsGrid.css";

interface DocumentsGridProps {
  projectPath: string | null;
  projectName: string;
  collections: Collection[];
  selectedCollection: Collection | null;
  onSelectCollection: (collection: Collection | null) => void;
  files: FileItem[];
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  onNewDocument: (collection: Collection) => void;
}

function DocumentsGrid({
  projectPath,
  projectName,
  collections,
  selectedCollection,
  onSelectCollection,
  files,
  selectedFile,
  onSelectFile,
  onNewDocument,
}: DocumentsGridProps): React.ReactElement {
  // Show empty state if no project is open
  if (!projectPath) {
    return (
      <div className="documents-grid-container">
        <div className="documents-empty-state">
          <div className="empty-state-icon">📂</div>
          <h2>Welcome to Astro Editor</h2>
          <p>
            Select a workspace from the sidebar or open a new project to get
            started.
          </p>
        </div>
      </div>
    );
  }

  // Group files by collection for "All" view
  const groupedFiles = React.useMemo(() => {
    const groups: Record<string, FileItem[]> = {};
    files.forEach((file) => {
      const collectionName = file.collectionName || "Other";
      if (!groups[collectionName]) {
        groups[collectionName] = [];
      }
      groups[collectionName].push(file);
    });
    return groups;
  }, [files]);

  // Get collection by name
  const getCollectionByName = (name: string): Collection | undefined => {
    return collections.find((c) => c.name === name);
  };

  return (
    <div className="documents-grid-container">
      {/* Header with project name */}
      <div className="documents-header">
        <h1 className="documents-title">{projectName}</h1>
      </div>

      {/* Collection pills filter */}
      <div className="collection-pills">
        <button
          className={`collection-pill ${!selectedCollection ? "active" : ""}`}
          onClick={() => onSelectCollection(null)}
        >
          All
        </button>
        {collections.map((collection) => (
          <button
            key={collection.path}
            className={`collection-pill ${
              selectedCollection?.path === collection.path ? "active" : ""
            }`}
            onClick={() => onSelectCollection(collection)}
          >
            <span className="pill-indicator">○</span>
            {collection.name}
          </button>
        ))}
      </div>

      {/* Content area with scrolling */}
      <div className="documents-content">
        {/* "All" view - grouped by collection */}
        {!selectedCollection ? (
          collections.length === 0 ? (
            <div className="documents-empty-state">
              <p>No collections found in this project</p>
            </div>
          ) : (
            collections.map((collection) => {
              const collectionFiles = groupedFiles[collection.name] || [];
              return (
                <div key={collection.path} className="collection-section">
                  <div className="collection-section-header">
                    <h2 className="collection-section-title">
                      <span className="section-indicator">○</span>
                      {collection.name}
                    </h2>
                    <button
                      className="section-add-btn"
                      onClick={() => onNewDocument(collection)}
                    >
                      +
                    </button>
                  </div>
                  <div className="documents-grid">
                    {/* New document card for this collection */}
                    <div
                      className="document-card new-document"
                      onClick={() => onNewDocument(collection)}
                    >
                      <span className="new-document-icon">+</span>
                      <span className="new-document-text">New Doc</span>
                    </div>
                    {collectionFiles.map((file) => (
                      <DocumentCard
                        key={file.path}
                        file={file}
                        isSelected={selectedFile?.path === file.path}
                        onClick={() => onSelectFile(file)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* Single collection view */
          <div className="documents-grid">
            {/* New document card */}
            <div
              className="document-card new-document"
              onClick={() => onNewDocument(selectedCollection)}
            >
              <span className="new-document-icon">+</span>
              <span className="new-document-text">New Doc</span>
            </div>
            {files.length === 0 ? (
              <div className="no-files-message">
                No documents in this collection yet.
              </div>
            ) : (
              files.map((file) => (
                <DocumentCard
                  key={file.path}
                  file={file}
                  isSelected={selectedFile?.path === file.path}
                  onClick={() => onSelectFile(file)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsGrid;
