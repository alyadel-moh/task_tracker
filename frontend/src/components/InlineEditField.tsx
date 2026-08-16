import React, { useState, useEffect } from "react";
import { Check, X, Pencil, Loader2 } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface InlineEditFieldProps {
  label: string;
  value: string;
  type?: "text" | "textarea" | "select" | "number" | "date" | "datetime-local";
  optional?: boolean;
  options?: Option[];
  placeholder?: string;
  displayValue?: React.ReactNode;
  isSaving?: boolean;
  onSave: (value: string) => void;
}

const InlineEditField = ({
  label,
  value,
  type = "text",
  options = [],
  placeholder,
  displayValue,
  isSaving = false,
  onSave,
}: InlineEditFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  // Sync internal state when parent value updates
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Close editing mode ONLY after a save finishes successfully
  useEffect(() => {
    if (!isSaving && isEditing) {
      setIsEditing(false);
    }
  }, [isSaving]);

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setCurrentValue(newValue);
    if (newValue !== value) {
      onSave(newValue);
    } else {
      setIsEditing(false);
    }
  };

  return (
    <div className="inline-field">
      {label && (
        <div className="inline-field-header">
          <span className="inline-field-label">{label}</span>
        </div>
      )}

      {isEditing ? (
        <div className="inline-field-editor">
          {type === "textarea" ? (
            <textarea
              className="inline-field-input"
              value={currentValue}
              placeholder={placeholder}
              onChange={(e) => setCurrentValue(e.target.value)}
              rows={3}
              autoFocus
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === "Escape") handleCancel();
              }}
            />
          ) : type === "select" ? (
            <select
              className="inline-field-input"
              value={currentValue}
              onChange={handleSelectChange}
              autoFocus
              disabled={isSaving}
              onBlur={() => setIsEditing(false)}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              className="inline-field-input"
              value={currentValue}
              placeholder={placeholder}
              onChange={(e) => setCurrentValue(e.target.value)}
              autoFocus
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          )}

          {type !== "select" && (
            <div className="inline-field-actions">
              <button
                type="button"
                className="inline-field-action inline-field-cancel"
                onClick={handleCancel}
                disabled={isSaving}
                aria-label="Cancel editing"
              >
                <X size={14} />
              </button>
              <button
                type="button"
                className="inline-field-action inline-field-save"
                onClick={handleSave}
                disabled={isSaving}
                aria-label="Save changes"
              >
                {isSaving ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Check size={14} />
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className="inline-field-display"
          onClick={() => setIsEditing(true)}
        >
          <span className="inline-field-value">
            {displayValue || value || (
              <span className="inline-field-empty">
                {placeholder || "Click to add..."}
              </span>
            )}
          </span>
          <button
            type="button"
            className="inline-field-edit-button"
            aria-label={`Edit ${label || "field"}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Pencil size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

export default InlineEditField;
