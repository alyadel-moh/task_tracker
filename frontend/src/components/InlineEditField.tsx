import React, { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface InlineEditFieldProps {
  label?: string;
  value: string;
  type?: "text" | "textarea" | "select" | "date" | "datetime-local" | "number";
  options?: Option[];
  placeholder?: string;
  optional?: boolean;
  displayValue?: React.ReactNode;
  onSave: (newValue: string) => void;
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  type = "text",
  options = [],
  placeholder = "Click to edit...",
  displayValue,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const inputRef = useRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(null);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleConfirmLocalEdit = () => {
    onSave(draftValue);
    setIsEditing(false);
  };

  const handleCancelLocalEdit = () => {
    setDraftValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="inline-field-editor">
        {type === "textarea" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="inline-field-input"
            value={draftValue}
            placeholder={placeholder}
            onChange={(e) => setDraftValue(e.target.value)}
          />
        ) : type === "select" ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            className="inline-field-input"
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            className="inline-field-input"
            value={draftValue}
            placeholder={placeholder}
            onChange={(e) => setDraftValue(e.target.value)}
          />
        )}

        <div className="inline-field-actions">
          <button
            type="button"
            className="inline-field-action inline-field-save"
            onMouseDown={(e) => {
              e.preventDefault();
              handleConfirmLocalEdit();
            }}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            className="inline-field-action inline-field-cancel"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCancelLocalEdit();
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="inline-field-display"
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
    >
      <div className="inline-field-value">
        {displayValue ||
          (value ? value : <span className="placeholder">{placeholder}</span>)}
      </div>
    </div>
  );
};

export default InlineEditField;
