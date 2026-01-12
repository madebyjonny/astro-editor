import React, { useState, useMemo } from "react";
import slugify from "slugify";

function NewFileModal({ schema, onClose, onCreate }) {
  const [formData, setFormData] = useState(() => {
    const initial = {};
    Object.keys(schema).forEach((key) => {
      if (schema[key].type === "boolean") {
        initial[key] = false;
      } else if (schema[key].type === "array") {
        initial[key] = [];
      } else if (schema[key].type === "date") {
        initial[key] = new Date().toISOString().split("T")[0];
      } else {
        initial[key] = "";
      }
    });
    return initial;
  });

  const [tagInputs, setTagInputs] = useState({});

  const filename = useMemo(() => {
    const title = formData.title || formData.name || "";
    if (!title) return "";
    return slugify(title, { lower: true, strict: true }) + ".md";
  }, [formData.title, formData.name]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddTag = (key) => {
    const input = tagInputs[key];
    if (input?.trim()) {
      handleChange(key, [...(formData[key] || []), input.trim()]);
      setTagInputs((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleRemoveTag = (key, index) => {
    const newValue = formData[key].filter((_, i) => i !== index);
    handleChange(key, newValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    const missingRequired = Object.keys(schema)
      .filter((key) => schema[key].required && !formData[key])
      .map((key) => key);

    if (missingRequired.length > 0) {
      alert(`Please fill in required fields: ${missingRequired.join(", ")}`);
      return;
    }

    if (!filename) {
      alert("Please enter a title to generate the filename");
      return;
    }

    // Convert date strings to Date objects for frontmatter
    const frontmatter = { ...formData };
    Object.keys(schema).forEach((key) => {
      if (schema[key].type === "date" && frontmatter[key]) {
        frontmatter[key] = new Date(frontmatter[key]);
      }
    });

    onCreate(filename, frontmatter);
  };

  const renderField = (key, fieldSchema) => {
    const isRequired = fieldSchema?.required;

    switch (fieldSchema?.type) {
      case "boolean":
        return (
          <div className="field-group" key={key}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="field-input"
                checked={formData[key] || false}
                onChange={(e) => handleChange(key, e.target.checked)}
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
              value={formData[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
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
              value={formData[key] || ""}
              onChange={(e) =>
                handleChange(key, e.target.value ? Number(e.target.value) : "")
              }
            />
          </div>
        );

      case "array":
        return (
          <div className="field-group" key={key}>
            <label className="field-label">
              {key}
              {isRequired && <span className="required">*</span>}
            </label>
            <div className="tags-container">
              {(formData[key] || []).map((item, index) => (
                <span key={index} className="tag">
                  {item}
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={() => handleRemoveTag(key, index)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className="field-input"
              value={tagInputs[key] || ""}
              onChange={(e) =>
                setTagInputs((prev) => ({ ...prev, [key]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag(key);
                }
              }}
              placeholder="Type and press Enter to add"
            />
          </div>
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
              value={formData[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New File</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {Object.keys(schema).map((key) => renderField(key, schema[key]))}

            {filename && (
              <div
                className="field-group"
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid #3c3c3c",
                }}
              >
                <label className="field-label">Generated Filename</label>
                <div
                  style={{
                    padding: "8px 10px",
                    background: "#2d2d2d",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                  }}
                >
                  {filename}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewFileModal;
