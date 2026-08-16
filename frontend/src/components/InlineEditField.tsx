import React, { useState, useEffect } from "react";
import { Check, X, Pencil, Loader2 } from "lucide-react";

export interface Option {
  value: string;
  label: string;
}

export interface InlineEditFieldProps {
  label?: string;
  value: string | number;
  type?: "text" | "textarea" | "select" | "number" | "date" | "datetime-local";
  optional?: boolean;
  options?: Option[] | string[];
  placeholder?: string;
  displayValue?: React.ReactNode;
  isSaving?: boolean;
  isLoading?: boolean; // Aliased for backwards compatibility
  onSave: (value: any) => void;
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  label,
  value,
  type = "text",
  options = [],
  placeholder,
  displayValue,
  isSaving = false,
  isLoading = false,
  onSave,
}) => {
  const activeSaving = isSaving || isLoading;
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState<string | number>(
    value ?? "",
  );

  // Synchronize internal state when parent value prop updates
  useEffect(() => {
    setCurrentValue(value ?? "");
  }, [value]);

  // Exit editing mode once save operation completes successfully
  useEffect(() => {
    if (!activeSaving && isEditing) {
      setIsEditing(false);
    }
  }, [activeSaving]);

  // Normalize options array into consistent { value, label } objects
  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setCurrentValue(value ?? "");
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
    <div className="inline-field w-full">
      {label && (
        <div className="inline-field-header mb-1">
          <span className="inline-field-label text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </span>
        </div>
      )}

      {isEditing ? (
        <div className="inline-field-editor flex items-center gap-2">
          {type === "textarea" ? (
            <textarea
              className="inline-field-input w-full p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
              value={currentValue}
              placeholder={placeholder}
              onChange={(e) => setCurrentValue(e.target.value)}
              rows={3}
              autoFocus
              disabled={activeSaving}
              onKeyDown={(e) => {
                if (e.key === "Escape") handleCancel();
              }}
            />
          ) : type === "select" ? (
            <select
              className="inline-field-input w-full p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white"
              value={currentValue}
              onChange={handleSelectChange}
              autoFocus
              disabled={activeSaving}
              onBlur={() => !activeSaving && setIsEditing(false)}
            >
              <option value="" disabled>
                {placeholder || "Select option..."}
              </option>
              {normalizedOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              className="inline-field-input w-full p-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
              value={currentValue}
              placeholder={placeholder}
              onChange={(e) => setCurrentValue(e.target.value)}
              autoFocus
              disabled={activeSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          )}

          {type !== "select" && (
            <div className="inline-field-actions flex items-center gap-1">
              <button
                type="button"
                className="inline-field-action inline-field-cancel p-1 text-gray-400 hover:text-red-600 rounded"
                onClick={handleCancel}
                disabled={activeSaving}
                aria-label="Cancel editing"
              >
                <X size={14} />
              </button>
              <button
                type="button"
                className="inline-field-action inline-field-save p-1 text-gray-400 hover:text-green-600 rounded"
                onClick={handleSave}
                disabled={activeSaving}
                aria-label="Save changes"
              >
                {activeSaving ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <Check size={14} />
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className="inline-field-display group flex items-center justify-between cursor-pointer p-1.5 -ml-1.5 rounded hover:bg-gray-100 transition-colors"
          onClick={() => setIsEditing(true)}
        >
          <span className="inline-field-value text-sm text-gray-800">
            {displayValue ||
              (value !== "" && value !== null && value !== undefined ? (
                String(value)
              ) : (
                <span className="inline-field-empty text-gray-400 italic">
                  {placeholder || "Click to add..."}
                </span>
              ))}
          </span>
          <button
            type="button"
            className="inline-field-edit-button opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1 rounded transition-opacity"
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
