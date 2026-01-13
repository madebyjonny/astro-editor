import React, { useState, KeyboardEvent, ChangeEvent } from "react";
import type { FileItem, Schema, Frontmatter, FieldSchema } from "../../types";
import "./MetadataPanel.css";

interface MetadataPanelProps {
  selectedFile: FileItem | null;
  frontmatter: Frontmatter;
  schema: Schema;
  onFrontmatterChange: (key: string, value: Frontmatter[string]) => void;
}

interface ArrayFieldProps {
  fieldKey: string;
  value: string[];
  isRequired: boolean;
  onChange: (newValue: string[]) => void;
}

function MetadataPanel({
  selectedFile,
  frontmatter,
  schema,
  onFrontmatterChange,
}: MetadataPanelProps): React.ReactElement {
  if (!selectedFile) {
    return (
      <div className="metadata-panel">
        <div className="metadata-header">Metadata</div>
        <div className="empty-state" style={{ padding: "20px" }}>
          <p style={{ fontSize: "13px" }}>Select a file to view metadata</p>
        </div>
      </div>
    );
  }

  const renderField = (
    key: string,
    fieldSchema: FieldSchema
  ): React.ReactElement => {
    const value = frontmatter[key];
    const isRequired = fieldSchema?.required;

    switch (fieldSchema?.type) {
      case "boolean":
        return (
          <div className="field-group" key={key}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="field-input"
                checked={(value as boolean) || false}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onFrontmatterChange(key, e.target.checked)
                }
              />
              <span className="field-label" style={{ marginBottom: 0 }}>
                {key}
                {isRequired && <span className="required">*</span>}
              </span>
            </label>
          </div>
        );

      case "date":
        return (
          <div className="field-group" key={key}>
            <label className="field-label">
              {key}
              {isRequired && <span className="required">*</span>}
            </label>
            <input
              type="date"
              className="field-input"
              value={
                value
                  ? new Date(value as string | Date).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onFrontmatterChange(
                  key,
                  e.target.value ? new Date(e.target.value) : null
                )
              }
            />
          </div>
        );

      case "number":
        return (
          <div className="field-group" key={key}>
            <label className="field-label">
              {key}
              {isRequired && <span className="required">*</span>}
            </label>
            <input
              type="number"
              className="field-input"
              value={(value as number) || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onFrontmatterChange(
                  key,
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            />
          </div>
        );

      case "array":
        return (
          <ArrayField
            key={key}
            fieldKey={key}
            value={(value as string[]) || []}
            isRequired={isRequired}
            onChange={(newValue) => onFrontmatterChange(key, newValue)}
          />
        );

      default:
        return (
          <div className="field-group" key={key}>
            <label className="field-label">
              {key}
              {isRequired && <span className="required">*</span>}
            </label>
            <input
              type="text"
              className="field-input"
              value={(value as string) || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onFrontmatterChange(key, e.target.value)
              }
            />
          </div>
        );
    }
  };

  // Get all fields from schema and frontmatter
  const allFields = new Set([
    ...Object.keys(schema),
    ...Object.keys(frontmatter),
  ]);

  return (
    <div className="metadata-panel">
      <div className="metadata-header">Metadata</div>
      <div className="metadata-content">
        {Array.from(allFields).map((key) => {
          const fieldSchema = schema[key] || {
            type: "string" as const,
            required: false,
          };
          return renderField(key, fieldSchema);
        })}
      </div>
    </div>
  );
}

function ArrayField({
  fieldKey,
  value,
  isRequired,
  onChange,
}: ArrayFieldProps): React.ReactElement {
  const [inputValue, setInputValue] = useState<string>("");

  const handleAdd = (): void => {
    if (inputValue.trim()) {
      onChange([...value, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number): void => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="field-group">
      <label className="field-label">
        {fieldKey}
        {isRequired && <span className="required">*</span>}
      </label>
      <div className="tags-container">
        {value.map((item, index) => (
          <span key={index} className="tag">
            {item}
            <button
              type="button"
              className="tag-remove"
              onClick={() => handleRemove(index)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="field-input"
        value={inputValue}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setInputValue(e.target.value)
        }
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter to add"
      />
    </div>
  );
}

export default MetadataPanel;
