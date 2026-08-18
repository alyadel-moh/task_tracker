import React, { useState, useEffect, useRef } from "react";
import { Check, X, ChevronDown } from "lucide-react";

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
  onCancel?: () => void;
  initialIsEditing?: boolean;
}

interface CustomInlineSelectProps {
  options: Option[];
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
}

const CustomInlineSelect: React.FC<CustomInlineSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);

  const handleToggle = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 180);
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`custom-select-container ${isOpen ? "dropdown-open" : ""}`}
      ref={dropdownRef}
      style={{ flex: 1 }}
    >
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? "active" : ""}`}
        onClick={handleToggle}
      >
        <div className="custom-select-trigger-content">
          <span className="custom-select-value">
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`custom-select-chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`custom-select-menu ${openUpward ? "menu-upward" : ""}`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                className={`custom-select-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} className="check-icon" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  type = "text",
  options = [],
  placeholder = "Click to edit...",
  displayValue,
  onSave,
  onCancel,
  initialIsEditing,
}) => {
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [draftValue, setDraftValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

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
    onCancel?.();
  };

  if (isEditing) {
    return (
      <div className="inline-field-editor" style={{ overflow: "visible" }}>
        {type === "textarea" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="inline-field-input"
            value={draftValue}
            placeholder={placeholder}
            onChange={(e) => setDraftValue(e.target.value)}
          />
        ) : type === "select" ? (
          <CustomInlineSelect
            options={options}
            value={draftValue}
            onChange={(newVal) => setDraftValue(newVal)}
            placeholder={placeholder}
          />
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
