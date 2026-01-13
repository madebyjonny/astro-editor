import React from "react";
import type { FileItem } from "../../types";
import "./DocumentCard.css";

interface DocumentCardProps {
  file: FileItem;
  isSelected: boolean;
  onClick: () => void;
}

function DocumentCard({
  file,
  isSelected,
  onClick,
}: DocumentCardProps): React.ReactElement {
  // Extract a title from filename (remove extension and dashes/underscores)
  const title = file.name
    .replace(/\.(md|mdx)$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div
      className={`document-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      {/* Collection badge at top */}
      {file.collectionName && (
        <span className="collection-badge">{file.collectionName}</span>
      )}

      {/* Document title */}
      <h3 className="document-card-title">{title}</h3>

      {/* Text preview - actual content */}
      {file.preview && <p className="document-card-preview">{file.preview}</p>}
    </div>
  );
}

export default DocumentCard;
