import React, { useState, KeyboardEvent, ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { FileItem } from "../../types";
import { useEditorStore } from "../stores";
import "./EditorPanel.css";

interface EditorPanelProps {
  selectedFile: FileItem | null;
  content: string;
  onContentChange: (value: string) => void;
  onBack?: () => void;
}

function EditorPanel({
  selectedFile,
  content,
  onContentChange,
  onBack,
}: EditorPanelProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert tab character at cursor position
      const newContent =
        content.substring(0, start) + "\t" + content.substring(end);
      onContentChange(newContent);

      // Move cursor after the tab character
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
    }
  };

  if (!selectedFile) {
    return (
      <div className="editor-panel">
        <div className="empty-state">
          <div className="empty-state-icon">✏️</div>
          <h2>No file selected</h2>
          <p>
            Select a file from the sidebar to start editing, or create a new
            file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-panel">
      {/* Floating toolbar */}
      <div className="editor-floating-toolbar">
        {/* Left: Back button */}
        {onBack && (
          <button className="floating-btn back-btn" onClick={onBack} title="Back to documents">
            ‹
          </button>
        )}
        
        {/* Center: Filename pill */}
        <div className="floating-filename">
          <span className="filename-text">{selectedFile.name.replace(/\.mdx?$/, "")}</span>
          {hasUnsavedChanges && <span className="unsaved-dot">●</span>}
        </div>
        
        {/* Right: Edit/Preview toggle */}
        <div className="floating-tabs">
          <button
            className={`floating-tab ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
            title="Edit mode"
          >
            Edit
          </button>
          <button
            className={`floating-tab ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
            title="Preview mode"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content area with rounded corners */}
      <div className="editor-content-wrapper">
        <div className="editor-content">
          {activeTab === "edit" ? (
            <textarea
              className="markdown-textarea"
              value={content}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onContentChange(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Start writing..."
              spellCheck={false}
            />
          ) : (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditorPanel;
