import React, {
  useState,
  useMemo,
  FormEvent,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import slugify from "slugify";
import type { Schema, Frontmatter, FieldSchema } from "../../types";
import "./NewFileModal.css";

interface NewFileModalProps {
  schema: Schema;
  onClose: () => void;
  onCreate: (filename: string, frontmatter: Frontmatter) => void;
}

interface FormData {
  [key: string]: string | number | boolean | string[] | Date | null;
}

interface TagInputs {
  [key: string]: string;
}

function NewFileModal({
  schema,
  onClose,
  onCreate,
}: NewFileModalProps): React.ReactElement {
  const [formData, setFormData] = useState<FormData>(() => {
    const initial: FormData = {};
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

  const [tagInputs, setTagInputs] = useState<TagInputs>({});

  const filename = useMemo(() => {
    const title = (formData.title as string) || (formData.name as string) || "";
    if (!title) return "";
    return slugify(title, { lower: true, strict: true }) + ".md";
  }, [formData.title, formData.name]);

  const handleChange = (key: string, value: FormData[string]): void => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddTag = (key: string): void => {
    const input = tagInputs[key];
    if (input?.trim()) {
      handleChange(key, [...((formData[key] as string[]) || []), input.trim()]);
      setTagInputs((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleRemoveTag = (key: string, index: number): void => {
    const newValue = (formData[key] as string[]).filter((_, i) => i !== index);
    handleChange(key, newValue);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
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
    const frontmatter: Frontmatter = { ...formData };
    Object.keys(schema).forEach((key) => {
      if (schema[key].type === "date" && frontmatter[key]) {
        frontmatter[key] = new Date(frontmatter[key] as string);
      }
    });

    onCreate(filename, frontmatter);
  };

  const renderField = (
    key: string,
    fieldSchema: FieldSchema
  ): React.ReactElement => {
    const isRequired = fieldSchema?.required;

    switch (fieldSchema?.type) {
      case "boolean":
        return (
          <div className="field-group" key={key}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="field-input"
                checked={(formData[key] as boolean) || false}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange(key, e.target.checked)
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
              value={(formData[key] as string) || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange(key, e.target.value)
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
              value={(formData[key] as number) || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
              {((formData[key] as string[]) || []).map((item, index) => (
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTagInputs((prev) => ({ ...prev, [key]: e.target.value }))
              }
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
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
              value={(formData[key] as string) || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange(key, e.target.value)
              }
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
