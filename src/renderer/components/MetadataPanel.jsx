import React, { useState } from "react";

function MetadataPanel({
  selectedFile,
  frontmatter,
  schema,
  onFrontmatterChange,
}) {
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

  const renderField = (key, fieldSchema) => {
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
                checked={value || false}
                onChange={(e) => onFrontmatterChange(key, e.target.checked)}
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
              value={value ? new Date(value).toISOString().split("T")[0] : ""}
              onChange={(e) =>
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
              value={value || ""}
              onChange={(e) =>
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
            value={value || []}
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
              value={value || ""}
              onChange={(e) => onFrontmatterChange(key, e.target.value)}
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
            type: "string",
            required: false,
          };
          return renderField(key, fieldSchema);
        })}
      </div>
    </div>
  );
}

function ArrayField({ fieldKey, value, isRequired, onChange }) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onChange([...value, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (index) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleKeyDown = (e) => {
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
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter to add"
      />
    </div>
  );
}

export default MetadataPanel;
