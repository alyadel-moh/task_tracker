import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  error?: boolean;
}

export const CustomSelect = ({
  options,
  value,
  onChange,
  icon,
  placeholder = "Select an option",
  error = false,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close on outside click
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
    <div className="custom-select-container" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? "active" : ""} ${
          error ? "input-error" : ""
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="custom-select-trigger-content">
          {icon && <span className="custom-select-icon">{icon}</span>}
          <span className="custom-select-value">
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`custom-select-chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="custom-select-menu">
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <div
                key={option.id}
                className={`custom-select-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
              >
                <span>{option.name}</span>
                {isSelected && <Check size={14} className="check-icon" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
